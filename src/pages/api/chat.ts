import type { APIRoute } from "astro";
import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    extractReasoningMiddleware,
    streamText,
    toUIMessageStream,
    wrapLanguageModel,
    type UIMessage,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const prerender = false;

function readEnv(key: "LLM_BASE_URL" | "LLM_API_KEY" | "LLM_MODEL"): string | undefined {
    const fromRuntime = typeof process !== "undefined" ? process.env[key] : undefined;
    return fromRuntime ?? import.meta.env[key];
}

const gatewayUrl = readEnv("LLM_BASE_URL");
const gatewayKey = readEnv("LLM_API_KEY");
const gatewayModel = readEnv("LLM_MODEL");

const SYSTEM_PROMPT = `You are the assistant of WanderleeDev's personal portfolio website.

WanderleeDev is a fullstack developer. Main stack: PostgreSQL, NestJS, Angular, Node.js.
Frontend: HTML5, CSS3, JavaScript, TypeScript, Angular, React, Next.js, Astro, Vue.js,
TailwindCSS, Sass, NgRx, GSAP. Backend: Node.js, NestJS, Express, PostgreSQL, Java,
Spring Boot, Python, FastAPI.

Featured projects:
- Ecommerce: Angular, Sass, TypeScript, Flowbite. JWT authentication, persistent cart,
  real-time notifications.
- Ubuntu Desktop: Angular, TailwindCSS, NgRx. Terminal, calendar and code editor.
- Ngx-theme-stack: Angular, TypeScript. Theme library with server-side rendering,
  dark/light mode and custom themes through Angular Signals.
- Switch 2 Clone: Vue, TailwindCSS, TypeScript. Nintendo Switch 2 landing page.

Contact: wanderleedev@gmail.com · github.com/WanderleeDev ·
linkedin.com/in/wanderlee-max/

Answer questions about the portfolio, the stack and the projects. Keep answers short
and to the point. Reply in the same language the visitor writes in.`;

export const POST: APIRoute = async ({ request }) => {
    if (!gatewayUrl || !gatewayKey || !gatewayModel) {
        return new Response("Chat is not configured.", { status: 503 });
    }

    const { messages }: { messages: UIMessage[] } = await request.json();

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
    });

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({ stream: result.stream, sendReasoning: false }),
    });
};
