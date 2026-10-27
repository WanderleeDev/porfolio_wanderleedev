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
import { getProjects, resolveLocale, techLabel } from "../../i18n/portfolio-data";
import { buildPortfolioContext, buildStackContext } from "../../i18n/portfolio-context";
import { portfolioToolInputSchema, toolIntroSchema } from "../../i18n/portfolio-cards";
import {
    formatProjectCatalog,
    loadProjectCatalog,
    type CatalogExtra,
} from "../../lib/rag/catalog";
import { createQdrantClient, readQdrantConfig } from "../../lib/rag/qdrant";
import { retrieveCorpus } from "../../lib/rag/retrieve";

export const prerender = false;

type EnvKey =
    | "LLM_BASE_URL"
    | "LLM_API_KEY"
    | "LLM_MODEL"
    | "LLM_EMBEDDING_MODEL"
    | "LLM_EMBEDDING_DIMENSIONS"
    | "QDRANT_URL"
    | "QDRANT_API_KEY"
    | "QDRANT_COLLECTION";

function readEnv(key: EnvKey): string | undefined {
    const fromRuntime = typeof process !== "undefined" ? process.env[key] : undefined;
    return fromRuntime ?? import.meta.env[key];
}

const gatewayUrl = readEnv("LLM_BASE_URL");
const gatewayKey = readEnv("LLM_API_KEY");
const gatewayModel = readEnv("LLM_MODEL");
const embeddingModel = readEnv("LLM_EMBEDDING_MODEL") ?? "qwen3-embedding:0.6b";
const embeddingDimensions = Number(readEnv("LLM_EMBEDDING_DIMENSIONS") ?? 512);

const SYSTEM_PROMPT = `You are the assistant of WanderleeDev's personal portfolio website.

WanderleeDev is a fullstack developer focused on agentic AI and product work. He works
with PostgreSQL, NestJS, Angular, Node.js, TypeScript, TailwindCSS and Astro on the
frontend and backend, and he builds AI agents with LLM gateways and the AI SDK.

Contact: wanderleedev@gmail.com · github.com/WanderleeDev ·
linkedin.com/in/wanderlee-max/`;

const TOOL_RULES = `Tool protocol, it overrides everything else:

- Visitor asks about the projects, the work or the portfolio -> call showPortfolio and
  include every project from PROJECT CATALOG, in catalog order (up to 10), unless the
  visitor asked for a subset. For a subset, include only the matching entries.
- Visitor asks about technologies, stack, tools, languages or frameworks -> call
  showPortfolio and fill the "stack" array.
- Visitor asks about both -> fill both arrays in the same call.
- Always include one short "intro" sentence in the same tool call. The card already
  shows the data, so never list it in the intro.
- Copy titles, technologies, URLs, images and accents verbatim from PROJECT CATALOG,
  STACK DATA or PORTFOLIO CONTEXT. Write each description as one sentence of at most 140
  characters taken from its catalog summary. Never invent projects, technologies, links,
  images or colors. If an entry has no image or demo, omit those fields; an empty
  "technologies" array is allowed.
- Omit the array the visitor did not ask about. Call showPortfolio once and stop: do
  not write a message after the tool call.
- Factual questions about a project (forks, dates, decisions, architecture, tradeoffs)
  -> answer in text from CORPUS EXCERPTS or PROJECT CATALOG without tools.
- Never call showPortfolio with empty "projects" and "stack" arrays. If you have
  nothing to show, answer in text.
- Anything else: answer without tools.`;

const STYLE_RULES = `Write only what was asked, in at most two short sentences. Do not wrap the text in
markdown, HTML or lists. This applies to the "intro" field and to plain answers; it
never applies to the card data.`;

const LANGUAGE_RULES = {
    es: "Answer in Spanish.",
    en: "Answer in English.",
} as const;

const CORPUS_RULES = `The CORPUS EXCERPTS come from the portfolio's technical PDF. Use them only when
they help answer the question and prefer them over assumptions. Never mention the
excerpts, the PDF or your sources. If they are unrelated, ignore them.`;

const CATALOG_RULES = `The PROJECT CATALOG is the full list of WanderleeDev's projects, taken from the
portfolio corpus. It is the only valid source for project cards: follow its order, do
not drop entries, and do not add projects that are not listed.`;

function buildSystemPrompt(
    locale: "es" | "en",
    options: { corpusContext?: string; projectCatalog?: string } = {},
): string {
    const sections = [
        SYSTEM_PROMPT,
        "",
        // With a catalog the project list is already there; a second, partial
        // list would only pull a small model back to the old four projects.
        options.projectCatalog ? buildStackContext(locale) : buildPortfolioContext(locale),
        "",
        LANGUAGE_RULES[locale],
        "",
        STYLE_RULES,
        "",
        TOOL_RULES,
    ];

    if (options.projectCatalog) {
        sections.push("", CATALOG_RULES, "", "PROJECT CATALOG:", options.projectCatalog);
    }

    if (options.corpusContext) {
        sections.push("", CORPUS_RULES, "", "CORPUS EXCERPTS:", options.corpusContext);
    }

    return sections.join("\n");
}

const MAX_MESSAGES = 40;
const MAX_TEXT_CHARS = 12_000;
const MAX_PART_CHARS = 4_000;

function logChatError(scope: string, error: unknown): void {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`[chat] ${scope}: ${detail}`);
}

interface RagContext {
    retrievalEnabled: boolean;
    retrieve(query: string): Promise<string>;
    projectCatalog(): Promise<string>;
}

/** Corpus ids mapped to the curated local title that owns the image and demo URL. */
const PROJECT_MEDIA_TITLES: Record<string, string> = {
    "clior-ecommerce": "Ecommerce",
    "ngx-theme-stack": "Ngx-theme-stack",
    "switch-2-clone": "Switch 2 Clone",
};

function projectExtras(): Map<string, CatalogExtra> {
    const projects = getProjects("es");
    const extras = new Map<string, CatalogExtra>();

    for (const [projectId, title] of Object.entries(PROJECT_MEDIA_TITLES)) {
        const local = projects.find((project) => project.title === title);
        if (!local) continue;
        extras.set(projectId, {
            image: local.image,
            demo_url: local.demo_url,
            technologies: local.technologies.map((tech) => techLabel(tech)),
        });
    }

    return extras;
}

function createRagContext(): RagContext | null {
    const url = readEnv("QDRANT_URL");
    if (!url) return null;

    try {
        const config = readQdrantConfig({
            QDRANT_URL: url,
            QDRANT_API_KEY: readEnv("QDRANT_API_KEY"),
            QDRANT_COLLECTION: readEnv("QDRANT_COLLECTION"),
        });
        const client = createQdrantClient(config, 10_000);
        const extras = projectExtras();
        const hasGateway = Boolean(gatewayUrl && gatewayKey);
        const retrievalEnabled =
            hasGateway && Number.isInteger(embeddingDimensions) && embeddingDimensions > 0;

        if (hasGateway && !retrievalEnabled) {
            logChatError(
                "retrieval-config",
                new Error("LLM_EMBEDDING_DIMENSIONS must be a positive integer"),
            );
        }

        const embedding =
            retrievalEnabled && gatewayUrl && gatewayKey
                ? {
                      baseURL: gatewayUrl,
                      apiKey: gatewayKey,
                      model: embeddingModel,
                      dimensions: embeddingDimensions,
                  }
                : null;

        let catalog: Promise<string> | null = null;

        return {
            retrievalEnabled,
            async retrieve(query: string) {
                if (!embedding) return "";

                const { context } = await retrieveCorpus(query, {
                    client,
                    collection: config.alias,
                    embedding,
                    limit: 3,
                    maxPerProject: 2,
                    // The gateway runs a 4096-token window: keep prompt + cards inside it.
                    maxCharsPerChunk: 1_300,
                    embeddingTimeoutMs: 8_000,
                    queryTimeoutSeconds: 5,
                });
                return context;
            },
            async projectCatalog() {
                catalog ??= loadProjectCatalog(client, config.alias).then(
                    (entries) => formatProjectCatalog(entries, extras),
                    (error) => {
                        catalog = null;
                        throw error;
                    },
                );
                return catalog;
            },
        };
    } catch (error) {
        logChatError("retrieval-config", error);
        return null;
    }
}

const rag = createRagContext();

const GREETING = /^(hola|hi|hello|hey|buenas|qué tal|que tal|gracias|thanks|thank you)[!.?\s]*$/i;

function shouldRetrieve(text: string): boolean {
    return text.length >= 4 && !GREETING.test(text);
}

const PROJECT_INTENT =
    /\b(proyectos?|projects?|trabajos?|portafolio|portfolio)\b|qué has (hecho|construido)|what have you (built|made)/i;

function wantsProjectCatalog(text: string): boolean {
    return text.length >= 4 && PROJECT_INTENT.test(text);
}

function latestUserText(messages: UIMessage[]): string {
    const last = messages.at(-1);
    if (!last) return "";

    return last.parts
        .flatMap((part) => (part.type === "text" ? [part.text] : []))
        .join(" ")
        .trim();
}

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

    let corpusContext = "";
    let projectCatalog = "";
    const question = latestUserText(messages);

    if (rag) {
        if (wantsProjectCatalog(question)) {
            try {
                projectCatalog = await rag.projectCatalog();
            } catch (error) {
                // Sin catálogo el chat puede seguir con el contexto corto y excerpts.
                logChatError("catalog", error);
            }
        }

        if (!projectCatalog && rag.retrievalEnabled && shouldRetrieve(question)) {
            try {
                corpusContext = await rag.retrieve(question);
            } catch (error) {
                // La respuesta debe salir aunque Qdrant o el embedding fallen.
                logChatError("retrieval", error);
            }
        }
    }

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
        system: buildSystemPrompt(locale, { corpusContext, projectCatalog }),
        messages: await convertToModelMessages(messages),
        tools,
        // Una sola generación: la tool ya trae la data y la intro.
        stopWhen: stepCountIs(1),
        // La data de las cards ahora forma parte de la salida.
        maxOutputTokens: 1400,
        temperature: 0,
        providerOptions: {
            wanderleeGateway: { think: false },
        },
        onError: ({ error }) => logChatError("stream", error),
    });

    return createUIMessageStreamResponse({
        stream: result.toUIMessageStream({
            sendReasoning: false,
            onError: (error) => {
                logChatError("ui-stream", error);
                return "An error occurred.";
            },
        }),
    });
};
