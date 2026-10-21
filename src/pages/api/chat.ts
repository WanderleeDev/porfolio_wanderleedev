import type { APIRoute } from "astro";
import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    extractReasoningMiddleware,
    streamText,
    tool,
    wrapLanguageModel,
    type ToolExecutionOptions,
    type UIMessage,
    type UIMessageChunk,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import {
    filterProjects,
    filterStack,
    getProjects,
    getStack,
    resolveLocale,
} from "../../i18n/portfolio-data";
import { getTranslations } from "../../i18n/utils";

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

Featured projects:
- Portfolio AI Chat: Astro, React, TypeScript, Vercel AI SDK, pixel-pet agent. Streaming
  chat with an animated agent that reacts to the conversation, served through a custom
  OpenAI-compatible LLM gateway.
- Ecommerce: Angular, Sass, TypeScript, Flowbite. JWT authentication, persistent cart,
  real-time notifications.
- Ubuntu Desktop: Angular, TailwindCSS, NgRx. Terminal, calendar and code editor.
- Ngx-theme-stack: Angular, TypeScript. Theme library with server-side rendering,
  dark/light mode and custom themes through Angular Signals.
- Switch 2 Clone: Vue, TailwindCSS, TypeScript. Nintendo Switch 2 landing page.

Contact: wanderleedev@gmail.com · github.com/WanderleeDev ·
linkedin.com/in/wanderlee-max/`;

const CARD_RULES = `When the visitor asks about the projects or the technology stack, a structured
card is rendered right below your message, with the real data. In that case your
message must be ONE short sentence of at most 15 words that introduces the card.

Never enumerate the projects, the technologies or their descriptions in your own
words: the card shows all of them.`;

const FORMAT_RULES = `Your reply is plain text for a chat bubble. Never use HTML tags, markdown,
lists, tables, JSON payloads or code blocks. Answer in at most three short
sentences, and only what was asked.`;

const LANGUAGE_RULES = {
    es: "Answer in Spanish.",
    en: "Answer in English.",
} as const;

function buildSystemPrompt(locale: "es" | "en"): string {
    return [
        SYSTEM_PROMPT,
        "",
        LANGUAGE_RULES[locale],
        "",
        FORMAT_RULES,
        "",
        CARD_RULES,
    ].join("\n");
}

type ToolName = "showProjects" | "showStack";

const INTENT_PATTERNS: Array<{ tool: ToolName; pattern: RegExp }> = [
    { tool: "showProjects", pattern: /\b(proyecto|proyectos|trabajo|trabajos|portfolio)\b/i },
    {
        tool: "showStack",
        pattern: /\b(stack|tecnolog\w*|herramienta\w*|lenguaje\w*|framework\w*|librer\w+)\b/i,
    },
];

function detectToolIntent(text: string, locale: "es" | "en"): ToolName[] {
    const intents = INTENT_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ tool }) => tool);
    if (intents.includes("showProjects") && mentionsSpecificProject(text, locale)) {
        return intents.filter((tool) => tool !== "showProjects");
    }
    return intents;
}

const GENERIC_PROJECT_WORDS = new Set(["portfolio"]);

function mentionsSpecificProject(text: string, locale: "es" | "en"): boolean {
    const haystack = text.toLowerCase();
    return getProjects(locale).some((project) => {
        const words = project.title.toLowerCase().split(/\s+/);
        return words.some(
            (word) => word.length >= 4 && !GENERIC_PROJECT_WORDS.has(word) && haystack.includes(word),
        );
    });
}

function lastUserText(messages: UIMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.role !== "user") continue;
        return message.parts
            .map((p) => (p.type === "text" ? ((p as { text?: string }).text ?? "") : ""))
            .join(" ")
            .trim();
    }
    return "";
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

function projectFocus(text: string, locale: "es" | "en"): string | undefined {
    const haystack = text.toLowerCase();
    const mentioned = getProjects(locale).flatMap((p) => p.technologies);
    return mentioned.find((tech) => haystack.includes(tech.toLowerCase()));
}

function stackFocus(text: string, locale: "es" | "en"): string | undefined {
    const haystack = text.toLowerCase();
    return getStack(locale)
        .map((category) => category.title)
        .find((title) => title.length > 3 && haystack.includes(title.toLowerCase()));
}

export const POST: APIRoute = async ({ request }) => {
    if (!gatewayUrl || !gatewayKey || !gatewayModel) {
        return new Response("Chat is not configured.", { status: 503 });
    }

    const { messages }: { messages: UIMessage[] } = await request.json();
    const locale = resolveLocale(request.headers.get("x-locale"));
    const question = lastUserText(messages);
    const intents = detectToolIntent(question, locale);

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

    const inputs: Record<ToolName, Record<string, string>> = {
        showProjects: { focus: projectFocus(question, locale) ?? "" },
        showStack: { category: stackFocus(question, locale) ?? "" },
    };

    const cardChunks: UIMessageChunk[] = [];
    for (const name of intents) {
        const toolCallId = `card-${name}`;
        const execute = tools[name].execute as (
            input: Record<string, string>,
            options: ToolExecutionOptions,
        ) => Promise<unknown>;
        const output = await execute(inputs[name], {
            toolCallId,
            messages: [],
            context: undefined,
        });
        cardChunks.push(
            { type: "tool-input-available", toolCallId, toolName: name, input: inputs[name] },
            { type: "tool-output-available", toolCallId, output },
        );
    }

    if (intents.length > 0) {
        const t = getTranslations(locale)("chat");
        const intro =
            intents.length > 1
                ? t.cardProjectsAndStack
                : intents[0] === "showProjects"
                  ? t.cardProjects
                  : t.cardStack;

        const stream = new ReadableStream<UIMessageChunk>({
            start(controller) {
                controller.enqueue({ type: "start" });
                controller.enqueue({ type: "start-step" });
                controller.enqueue({ type: "text-start", id: "txt-card" });
                controller.enqueue({ type: "text-delta", id: "txt-card", delta: intro });
                controller.enqueue({ type: "text-end", id: "txt-card" });
                for (const chunk of cardChunks) controller.enqueue(chunk);
                controller.enqueue({ type: "finish-step" });
                controller.enqueue({ type: "finish", finishReason: "stop" });
                controller.close();
            },
        });

        return createUIMessageStreamResponse({ stream });
    }

    const result = streamText({
        model,
        system: buildSystemPrompt(locale),
        messages: await convertToModelMessages(withoutToolResults(messages)),
    });

    const modelStream = result.toUIMessageStream({ sendReasoning: true });

    const stream = new ReadableStream<UIMessageChunk>({
        async start(controller) {
            const reader = modelStream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
            }
            for (const chunk of cardChunks) controller.enqueue(chunk);
            controller.close();
        },
    });

    return createUIMessageStreamResponse({ stream });
};
