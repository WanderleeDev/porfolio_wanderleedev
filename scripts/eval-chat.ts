import { PROJECT_CATALOG, TECH_CATALOG } from "../src/ai/catalog";
import { REFERENCE_QUESTIONS, type ReferenceQuestion } from "../tests/eval/reference-questions";

const DEFAULT_BASE_URL = process.env.EVAL_BASE_URL ?? "http://127.0.0.1:4321";
const DEFAULT_TIMEOUT_MS = 120_000;

const REFUSAL =
    /no (tengo|sé|está|aparece|figura|puedo|dispongo|comparto|cuento|incluyo|hay información)|no (se )?encuentra|fuera (de|del) (mi|el) (corpus|contexto|alcance)|no puedo (responder|ayudarte)|no dispongo/i;

interface Options {
    baseUrl: string;
    timeoutMs: number;
    limit?: number;
    only: Set<string>;
    dryRun: boolean;
    help: boolean;
}

interface Captured {
    calls: Map<string, string>;
    outputs: Map<string, unknown>;
    toolErrors: string[];
    text: string;
}

interface RunResult {
    question: ReferenceQuestion;
    ok: boolean;
    detail: string;
    tools: string[];
    elapsedMs: number;
}

function parseArgs(argv: string[]): Options {
    const options: Options = {
        baseUrl: DEFAULT_BASE_URL,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        only: new Set(),
        dryRun: false,
        help: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const flag = argv[index];
        const next = (): string => {
            const value = argv[index + 1];
            if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
            index += 1;
            return value;
        };

        switch (flag) {
            case "--base-url":
                options.baseUrl = next().replace(/\/+$/, "");
                break;
            case "--timeout":
                options.timeoutMs = Number(next()) * 1000;
                if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
                    throw new Error("--timeout must be a positive number of seconds");
                }
                break;
            case "--limit":
                options.limit = Number(next());
                if (!Number.isInteger(options.limit) || options.limit <= 0) {
                    throw new Error("--limit must be a positive integer");
                }
                break;
            case "--only":
                for (const id of next().split(",")) options.only.add(id.trim());
                break;
            case "--dry-run":
                options.dryRun = true;
                break;
            case "--help":
            case "-h":
                options.help = true;
                break;
            default:
                throw new Error(`Unknown argument "${flag}"`);
        }
    }

    return options;
}

function printHelp(): void {
    console.log(`Run the reference questions against the chat API.

Usage:
  bun run eval:chat
  bun run eval:chat --only proyectos-basico,techs-basico
  bun run eval:chat --limit 5 --timeout 180

Options:
  --base-url <url>  Chat server root (default: ${DEFAULT_BASE_URL})
  --timeout <s>     Per-question timeout in seconds (default: 120)
  --limit <n>       Run only the first n questions
  --only <ids>      Comma-separated question ids
  --dry-run         List the questions without calling the API
  --help            Show this help

The server must be running (bun run dev) and the LLM gateway reachable.`);
}

function expectedProjects() {
    return PROJECT_CATALOG.map(({ nombre, descripcion, url }) => ({
        nombre,
        descripcion,
        ...(url ? { url } : {}),
    }));
}

function sameJson(left: unknown, right: unknown): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkToolOutput(toolName: string, output: unknown): string | null {
    if (!isRecord(output)) return "la salida de la herramienta no es un objeto";

    if (toolName === "displayProjects") {
        const expected = expectedProjects();
        if (!sameJson(output.proyectos, expected)) {
            return "las tarjetas de proyectos no coinciden con PROJECT_CATALOG";
        }
        return null;
    }

    if (toolName === "displayTechs") {
        if (!sameJson(output.techs, TECH_CATALOG)) {
            return "las tarjetas de tecnologías no coinciden con TECH_CATALOG";
        }
        return null;
    }

    if (toolName === "displayContact") {
        const expected = {
            name: "Wanderlee Max",
            email: "wanderleedev@gmail.com",
            linkedin: "https://linkedin.com/in/wanderlee-max",
            github: "https://github.com/WanderleeDev",
        };
        if (!sameJson(output, expected)) return "los datos de contacto no coinciden";
        return null;
    }

    return `herramienta inesperada "${toolName}"`;
}

async function readStream(response: Response): Promise<Captured> {
    const captured: Captured = {
        calls: new Map(),
        outputs: new Map(),
        toolErrors: [],
        text: "",
    };

    if (!response.body) throw new Error("la respuesta no tiene cuerpo");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const handle = (event: Record<string, unknown>) => {
        const type = event.type;
        if (type === "tool-input-available" && typeof event.toolCallId === "string" && typeof event.toolName === "string") {
            captured.calls.set(event.toolCallId, event.toolName);
        } else if (type === "tool-output-available" && typeof event.toolCallId === "string") {
            captured.outputs.set(event.toolCallId, event.output);
        } else if (type === "tool-output-error" && typeof event.errorText === "string") {
            captured.toolErrors.push(event.errorText);
        } else if (type === "text-delta" && typeof event.delta === "string") {
            captured.text += event.delta;
        }
    };

    for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary >= 0) {
            const raw = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);

            for (const line of raw.split("\n")) {
                if (!line.startsWith("data:")) continue;
                const payload = line.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;
                try {
                    handle(JSON.parse(payload) as Record<string, unknown>);
                } catch {
                }
            }

            boundary = buffer.indexOf("\n\n");
        }
    }

    return captured;
}

function evaluate(question: ReferenceQuestion, captured: Captured): { ok: boolean; detail: string } {
    const tools = [...captured.calls.values()];

    if (question.expectativa.tipo === "herramienta") {
        const expectedTool = question.expectativa.herramienta;
        if (!tools.includes(expectedTool)) {
            return { ok: false, detail: `esperaba ${expectedTool}, llamó [${tools.join(", ") || "ninguna"}]` };
        }

        const callId = [...captured.calls.entries()].find(([, name]) => name === expectedTool)?.[0];
        const output = callId ? captured.outputs.get(callId) : undefined;
        const mismatch = checkToolOutput(expectedTool, output);
        return mismatch ? { ok: false, detail: mismatch } : { ok: true, detail: `${expectedTool} devolvió el catálogo canónico` };
    }

    if (captured.toolErrors.length) {
        return { ok: false, detail: `error de herramienta: ${captured.toolErrors.join(" | ")}` };
    }

    if (tools.length) {
        return { ok: false, detail: `no esperaba herramientas, llamó [${tools.join(", ")}]` };
    }

    if (captured.text.trim().length < 20) {
        return { ok: false, detail: `respuesta demasiado corta: "${captured.text.trim()}"` };
    }

    if (question.expectativa.tipo === "narrativa") {
        return REFUSAL.test(captured.text)
            ? { ok: false, detail: "rechazó una pregunta que el corpus sí responde" }
            : { ok: true, detail: "respondió desde el corpus" };
    }

    return REFUSAL.test(captured.text)
        ? { ok: true, detail: "rechazó correctamente" }
        : { ok: false, detail: `no rechazó: "${captured.text.trim().slice(0, 120)}"` };
}

async function runQuestion(question: ReferenceQuestion, options: Options): Promise<RunResult> {
    const started = performance.now();

    try {
        const response = await fetch(`${options.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                messages: [
                    {
                        id: `eval-${question.id}`,
                        role: "user",
                        parts: [{ type: "text", text: question.pregunta }],
                    },
                ],
            }),
            signal: AbortSignal.timeout(options.timeoutMs),
        });

        if (!response.ok) {
            const body = (await response.text()).slice(0, 300);
            return {
                question,
                ok: false,
                detail: `HTTP ${response.status}: ${body}`,
                tools: [],
                elapsedMs: Math.round(performance.now() - started),
            };
        }

        const captured = await readStream(response);
        const { ok, detail } = evaluate(question, captured);

        return {
            question,
            ok,
            detail,
            tools: [...captured.calls.values()],
            elapsedMs: Math.round(performance.now() - started),
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            question,
            ok: false,
            detail: message,
            tools: [],
            elapsedMs: Math.round(performance.now() - started),
        };
    }
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printHelp();
        return;
    }

    let questions = REFERENCE_QUESTIONS;
    if (options.only.size) {
        questions = questions.filter((question) => options.only.has(question.id));
        if (!questions.length) throw new Error(`no question matches --only ${[...options.only].join(",")}`);
    }
    if (options.limit) questions = questions.slice(0, options.limit);

    if (options.dryRun) {
        for (const question of questions) {
            console.log(`${question.id.padEnd(20)} ${question.expectativa.tipo.padEnd(12)} ${question.pregunta}`);
        }
        console.log(`\n${questions.length} preguntas`);
        return;
    }

    console.log(`Servidor: ${options.baseUrl}`);
    console.log(`Preguntas: ${questions.length}\n`);

    const results: RunResult[] = [];
    for (const [index, question] of questions.entries()) {
        process.stdout.write(`[${index + 1}/${questions.length}] ${question.id} … `);
        const result = await runQuestion(question, options);
        results.push(result);
        console.log(`${result.ok ? "OK" : "FALLO"} (${(result.elapsedMs / 1000).toFixed(1)}s)`);
        console.log(`         ${result.detail}`);
    }

    const failures = results.filter((result) => !result.ok);
    const totalMs = results.reduce((sum, result) => sum + result.elapsedMs, 0);

    console.log(`\n${results.length} preguntas · ${results.length - failures.length} OK · ${failures.length} fallos · ${(totalMs / 1000).toFixed(1)}s`);

    if (failures.length) {
        console.log("\nFallos:");
        for (const failure of failures) {
            console.log(`- ${failure.question.id}: ${failure.detail}`);
        }
        process.exitCode = 1;
    }
}

await main();
