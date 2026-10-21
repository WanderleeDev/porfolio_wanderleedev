import type { APIRoute } from "astro";
import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    extractReasoningMiddleware,
    stepCountIs,
    streamText,
    tool,
    toUIMessageStream,
    wrapLanguageModel,
    type UIMessage,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import {
    filterProjects,
    filterStack,
    resolveLocale,
} from "../../i18n/portfolio-data";

export const prerender = false;

function readEnv(key: "LLM_BASE_URL" | "LLM_API_KEY" | "LLM_MODEL"): string | undefined {
    const fromRuntime = typeof process !== "undefined" ? process.env[key] : undefined;
    return fromRuntime ?? import.meta.env[key];
}

const gatewayUrl = readEnv("LLM_BASE_URL");
const gatewayKey = readEnv("LLM_API_KEY");
const gatewayModel = readEnv("LLM_MODEL");

const SYSTEM_PROMPT = `You are the assistant of WanderleeDev's personal portfolio website.

WanderleeDev is a fullstack developer focused on agentic AI and product work. Main
stack: PostgreSQL, NestJS, Angular, Node.js, TypeScript, TailwindCSS, Astro.
Frontend: HTML5, CSS3, JavaScript, TypeScript, Angular, React, Next.js, Astro, Vue.js,
TailwindCSS, Sass, NgRx, GSAP. Backend: Node.js, NestJS, Express, PostgreSQL, Java,
Spring Boot, Python, FastAPI. AI: LLM gateways, AI SDK streaming, tool-using agents,
RAG, evaluation.

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
linkedin.com/in/wanderlee-max/

Answer questions about the portfolio, the stack and the projects. Keep answers short
and to the point. Reply in the same language the visitor writes in.

When a visitor asks about your projects or your technology stack, call the
showProjects or showStack tool to render a structured card instead of only listing
them in text.`;

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

    const result = streamText({
        model,
        system: SYSTEM_PROMPT,
        messages: await convertToModelMessages(messages),
        tools: {
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
        },
        stopWhen: stepCountIs(3),
    });

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({ stream: result.stream, sendReasoning: false }),
    });
};
