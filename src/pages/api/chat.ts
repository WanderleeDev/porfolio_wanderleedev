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
import { filterProjects, filterStack, resolveLocale } from "../../i18n/portfolio-data";
import { buildPortfolioContext } from "../../i18n/portfolio-context";

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

- Visitor asks about the projects, the work or the portfolio -> call showProjects.
- Visitor asks about technologies, stack, tools, languages or frameworks -> call
  showStack.
- After the tool runs, write ONE short sentence introducing the card. Never list what
  the card already shows.
- Anything else: answer without tools.`;

const STYLE_RULES = `Write only what was asked, in at most two short sentences. Do not wrap the text in
markdown, HTML or lists. This style rule applies to your message, never to a tool call.`;

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

        for (const part of message.parts) {
            // Sólo viaja texto al modelo: fuera adjuntos, tool calls y reasoning.
            if (part.type !== "text" || typeof part.text !== "string") continue;
            const text = part.text.trim();
            if (!text) continue;
            total += text.length;
            parts.push({ type: "text", text });
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
        showProjects: tool({
            description:
                "Show WanderleeDev's featured portfolio projects with their description and technologies.",
            inputSchema: z.object({
                focus: z
                    .string()
                    .optional()
                    .describe("Optional filter, e.g. 'frontend', 'angular', 'ecommerce'"),
            }),
            execute: async ({ focus }) => ({ projects: filterProjects(locale, focus) }),
        }),
        showStack: tool({
            description:
                "Show WanderleeDev's technology stack grouped by category (frontend, backend, AI, ...).",
            inputSchema: z.object({
                category: z
                    .string()
                    .optional()
                    .describe("Optional category filter, e.g. 'frontend', 'backend', 'ai'"),
            }),
            execute: async ({ category }) => ({ categories: filterStack(locale, category) }),
        }),
    };

    const result = streamText({
        model,
        system: buildSystemPrompt(locale),
        messages: await convertToModelMessages(messages),
        tools,
        // Dos pasos: el modelo llama a la herramienta y después escribe la frase.
        stopWhen: stepCountIs(2),
        // El razonamiento del modelo también consume este presupuesto.
        maxOutputTokens: 800,
        temperature: 0,
    });

    return createUIMessageStreamResponse({
        stream: result.toUIMessageStream({ sendReasoning: false }),
    });
};
