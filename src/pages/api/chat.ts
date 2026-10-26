import type { APIRoute } from "astro";
import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    extractReasoningMiddleware,
    stepCountIs,
    streamText,
    tool,
    wrapLanguageModel,
    type UIMessage,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { resolveLocale } from "../../i18n/portfolio-data";
import { buildPortfolioContext } from "../../i18n/portfolio-context";
import { portfolioToolInputSchema, toolIntroSchema } from "../../i18n/portfolio-cards";

export const prerender = false;

function readEnv(key: "LLM_BASE_URL" | "LLM_API_KEY" | "LLM_MODEL"): string | undefined {
    const fromRuntime = typeof process !== "undefined" ? process.env[key] : undefined;
    return fromRuntime ?? import.meta.env[key];
}

const gatewayUrl = readEnv("LLM_BASE_URL");
const gatewayKey = readEnv("LLM_API_KEY");
const gatewayModel = readEnv("LLM_MODEL");

const SYSTEM_PROMPT = `You are the assistant of WanderleeDev's personal portfolio website.

WanderleeDev is a fullstack developer focused on agentic AI and product work. He works
with PostgreSQL, NestJS, Angular, Node.js, TypeScript, TailwindCSS and Astro on the
frontend and backend, and he builds AI agents with LLM gateways and the AI SDK.

Contact: wanderleedev@gmail.com · github.com/WanderleeDev ·
linkedin.com/in/wanderlee-max/`;

const TOOL_RULES = `Tool protocol, it overrides everything else:

- Visitor asks about the projects, the work or the portfolio -> call showPortfolio and
  fill the "projects" array with the real projects from PORTFOLIO CONTEXT.
- Visitor asks about technologies, stack, tools, languages or frameworks -> call
  showPortfolio and fill the "stack" array.
- Visitor asks about both -> fill both arrays in the same call.
- Always include one short "intro" sentence in the same tool call. The card already
  shows the data, so never list it in the intro.
- Copy titles, descriptions, technologies, URLs, images and accents verbatim from
  PORTFOLIO CONTEXT. Never invent projects, technologies, links, images or colors.
- Omit the array the visitor did not ask about. Call showPortfolio once and stop: do
  not write a message after the tool call.
- Anything else: answer without tools.`;

const STYLE_RULES = `Write only what was asked, in at most two short sentences. Do not wrap the text in
markdown, HTML or lists. This applies to the "intro" field and to plain answers; it
never applies to the card data.`;

const LANGUAGE_RULES = {
    es: "Answer in Spanish.",
    en: "Answer in English.",
} as const;

function buildSystemPrompt(locale: "es" | "en"): string {
    return [
        SYSTEM_PROMPT,
        "",
        buildPortfolioContext(locale),
        "",
        LANGUAGE_RULES[locale],
        "",
        STYLE_RULES,
        "",
        TOOL_RULES,
    ].join("\n");
}

const MAX_MESSAGES = 40;
const MAX_TEXT_CHARS = 12_000;
const MAX_PART_CHARS = 4_000;

const chatSchema = z.object({
    messages: z
        .array(
            z.object({
                // El rol system lo fija el servidor: nunca aceptamos uno del cliente.
                role: z.enum(["user", "assistant"]),
                id: z.string().max(128).optional(),
                parts: z
                    .array(
                        z.looseObject({
                            type: z.string().max(64),
                            text: z.string().max(MAX_PART_CHARS).optional(),
                            // Sólo nos interesa la intro del turno anterior; el
                            // resto de la data de la card no vuelve al modelo.
                            input: z.object({ intro: z.string().max(180).optional() }).optional(),
                        }),
                    )
                    .min(1)
                    .max(32),
            }),
        )
        .min(1)
        .max(MAX_MESSAGES),
});

type ChatMessage = z.infer<typeof chatSchema>["messages"][number];

function sanitizeMessages(messages: ChatMessage[]): UIMessage[] | null {
    let total = 0;
    const sanitized: UIMessage[] = [];

    for (const message of messages) {
        const parts: UIMessage["parts"] = [];
        let hasText = false;
        let intro = "";

        for (const part of message.parts) {
            if (part.type === "text" && typeof part.text === "string") {
                const text = part.text.trim();
                if (!text) continue;
                total += text.length;
                parts.push({ type: "text", text });
                hasText = true;
                continue;
            }

            // Un turno con card no trae texto: conservamos sólo su intro para
            // que el modelo recuerde lo que dijo. La data de la card no viaja.
            if (!intro && message.role === "assistant" && part.type.startsWith("tool-")) {
                const parsedIntro = toolIntroSchema.safeParse(part.input);
                if (parsedIntro.success) intro = parsedIntro.data.intro;
            }
        }

        if (!hasText && intro) {
            total += intro.length;
            parts.push({ type: "text", text: intro });
        }

        if (parts.length) {
            sanitized.push({ id: message.id ?? "", role: message.role, parts });
        }
    }

    return total > MAX_TEXT_CHARS ? null : sanitized;
}

export const POST: APIRoute = async ({ request }) => {
    if (!gatewayUrl || !gatewayKey || !gatewayModel) {
        return Response.json({ error: "not_configured" }, { status: 503 });
    }

    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const parsed = chatSchema.safeParse(payload);

    if (!parsed.success) {
        return Response.json({ error: "invalid_request" }, { status: 400 });
    }

    const messages = sanitizeMessages(parsed.data.messages);

    // La conversación debe terminar en el visitante: nada de dictarle respuestas
    // al asistente ni de gastar tokens sin una pregunta.
    if (!messages?.length || messages[messages.length - 1]?.role !== "user") {
        return Response.json({ error: "invalid_request" }, { status: 400 });
    }

    const locale = resolveLocale(request.headers.get("x-locale"));

    const llm = createOpenAICompatible({
        name: "wanderlee-gateway",
        baseURL: gatewayUrl.replace(/\/chat\/completions\/?$/, ""),
        apiKey: gatewayKey,
    });

    const model = wrapLanguageModel({
        model: llm(gatewayModel),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
    });

    const tools = {
        showPortfolio: tool({
            description:
                "Show WanderleeDev's projects and/or technology stack as cards. Copy the real data from PORTFOLIO CONTEXT into the arrays and include one short intro sentence in the same call.",
            inputSchema: portfolioToolInputSchema,
            // La data la emite el modelo: no se filtra nada del portfolio local.
            execute: async (input) => input,
        }),
    };

    const result = streamText({
        model,
        system: buildSystemPrompt(locale),
        messages: await convertToModelMessages(messages),
        tools,
        // Una sola generación: la tool ya trae la data y la intro.
        stopWhen: stepCountIs(1),
        // La data de las cards ahora forma parte de la salida.
        maxOutputTokens: 2000,
        temperature: 0,
        providerOptions: {
            wanderleeGateway: { think: false },
        },
    });

    return createUIMessageStreamResponse({
        stream: result.toUIMessageStream({ sendReasoning: false }),
    });
};
