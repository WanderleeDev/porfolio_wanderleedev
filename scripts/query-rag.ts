import {
    createQdrantClient,
    readQdrantConfig,
} from "../src/lib/rag/qdrant";
import { retrieveCorpus } from "../src/lib/rag/retrieve";

const DEFAULT_MODEL = "qwen3-embedding:0.6b";
const DEFAULT_DIMENSIONS = 512;

interface Arguments {
    query?: string;
    limit: number;
    maxPerProject: number;
    full: boolean;
    json: boolean;
    help: boolean;
}

function integer(value: string, flag: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`${flag} must be a positive integer`);
    }
    return parsed;
}

function readDimensions(): number {
    const raw = process.env.LLM_EMBEDDING_DIMENSIONS?.trim();
    if (!raw) return DEFAULT_DIMENSIONS;

    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`LLM_EMBEDDING_DIMENSIONS must be a positive integer, got "${raw}"`);
    }
    return value;
}

function parseArguments(argv: string[]): Arguments {
    const args: Arguments = {
        limit: 8,
        maxPerProject: 2,
        full: false,
        json: false,
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
            case "--query":
                args.query = next();
                break;
            case "--limit":
                args.limit = integer(next(), flag);
                break;
            case "--max-per-project":
                args.maxPerProject = integer(next(), flag);
                break;
            case "--full":
                args.full = true;
                break;
            case "--json":
                args.json = true;
                break;
            case "--help":
            case "-h":
                args.help = true;
                break;
            default:
                if (flag.startsWith("--")) throw new Error(`Unknown argument "${flag}"`);
                args.query = args.query ? `${args.query} ${flag}` : flag;
        }
    }

    return args;
}

function printHelp(): void {
    console.log(`Query the Qdrant corpus with hybrid retrieval.

Usage:
  bun run rag:query -- --query "proyectos con Angular"
  bun run rag:query -- "¿Qué proyectos son forks?"

Options:
  --query <text>         Question to retrieve for (or pass it as an argument)
  --limit <n>            Chunks after grouping (default: 8)
  --max-per-project <n>  Chunks per project after fusion (default: 2)
  --full                 Print full chunk text instead of a preview
  --json                 Print JSON instead of the formatted context
  --help                 Show this help

Required environment:
  QDRANT_URL, QDRANT_API_KEY
  LLM_BASE_URL, LLM_API_KEY
`);
}

function preview(value: string, length = 400): string {
    const collapsed = value.replace(/\s+/g, " ").trim();
    return collapsed.length > length ? `${collapsed.slice(0, length)}…` : collapsed;
}

async function main(): Promise<void> {
    const args = parseArguments(process.argv.slice(2));

    if (args.help) {
        printHelp();
        return;
    }

    if (!args.query?.trim()) {
        printHelp();
        throw new Error("--query is required");
    }

    const baseURL = process.env.LLM_BASE_URL;
    const apiKey = process.env.LLM_API_KEY;
    if (!baseURL || !apiKey) {
        throw new Error("LLM_BASE_URL and LLM_API_KEY are required (see .env.example)");
    }

    const config = readQdrantConfig();
    const client = createQdrantClient(config);

    const started = performance.now();
    const result = await retrieveCorpus(args.query, {
        client,
        collection: config.alias,
        embedding: {
            baseURL,
            apiKey,
            model: process.env.LLM_EMBEDDING_MODEL?.trim() || DEFAULT_MODEL,
            dimensions: readDimensions(),
        },
        limit: args.limit,
        maxPerProject: args.maxPerProject,
    });
    const elapsed = Math.round(performance.now() - started);

    if (args.json) {
        console.log(JSON.stringify({ query: args.query, elapsedMs: elapsed, chunks: result.chunks }, null, 2));
        return;
    }

    console.log(`query      ${args.query}`);
    console.log(`collection ${config.alias}`);
    console.log(`chunks     ${result.chunks.length} · ${elapsed} ms\n`);

    if (!result.chunks.length) {
        console.log("no chunks matched");
        return;
    }

    result.chunks.forEach((chunk, position) => {
        const first = chunk.pages[0];
        const last = chunk.pages.at(-1);
        const pages = first === last ? `${first}` : `${first}-${last}`;
        const owner = chunk.projectId ? `${chunk.projectId} · ` : "";

        console.log(`[${position + 1}] ${owner}${chunk.title} · ${chunk.section} · p.${pages}`);
        console.log(`    score ${chunk.score.toFixed(4)} · ${chunk.text.length} chars`);
        console.log(`    ${args.full ? chunk.text : preview(chunk.text)}\n`);
    });
}

main().catch((error: unknown) => {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
});
