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

function withoutToolResults(messages: UIMessage[]): UIMessage[] {
    const stripped = messages.map((message) => {
        if (message.role !== "assistant") return message;
        const parts = message.parts.filter(
            (p) => p.type === "text" && (p as { text?: string }).text?.trim(),
        );
        return { ...message, parts } as UIMessage;
    });
    return stripped.filter((message) => message.role !== "assistant" || message.parts.length > 0);
}

export const POST: APIRoute = async ({ request }) => {
    if (!gatewayUrl || !gatewayKey || !gatewayModel) {
        return new Response("Chat is not configured.", { status: 503 });
    }

    const { messages }: { messages: UIMessage[] } = await request.json();
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
        messages: await convertToModelMessages(withoutToolResults(messages)),
        tools,
        stopWhen: stepCountIs(1),
        temperature: 0,
    });

    return createUIMessageStreamResponse({
        stream: result.toUIMessageStream({ sendReasoning: false }),
    });
};
