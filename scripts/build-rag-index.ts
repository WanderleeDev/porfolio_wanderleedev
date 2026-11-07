import { existsSync } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { embedTexts } from "../src/lib/rag/embed";
import {
    DEFAULT_MANIFEST,
    DEFAULT_MAX_CHARS,
    DEFAULT_OVERLAP_CHARS,
    loadCorpus,
    resolveManifestPath,
} from "../src/lib/rag/corpus";
import {
    corpusIndexSchema,
    corpusManifestSchema,
    type CorpusIndex,
    type CorpusManifest,
} from "../src/lib/rag/schema";
import { estimateTokens } from "../src/lib/rag/text";

const DEFAULT_OUT = "data/corpus/corpus-index.json";
const DEFAULT_VECTORS_OUT = "data/rag-vectors.ndjson";
const DEFAULT_MODEL = "qwen3-embedding:0.6b";
const DEFAULT_DIMENSIONS = 512;
const PAGE_PREVIEW_CHARS = 90;

interface Arguments {
    pdf?: string;
    manifest?: string;
    out: string;
    vectorsOut: string;
    model: string;
    dimensions: number;
    maxChars: number;
    overlapChars: number;
    dryRun: boolean;
    check: boolean;
    initManifest: boolean;
    keepRunningLines: boolean;
    force: boolean;
    help: boolean;
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
        out: DEFAULT_OUT,
        vectorsOut: DEFAULT_VECTORS_OUT,
        model: process.env.LLM_EMBEDDING_MODEL?.trim() || DEFAULT_MODEL,
        dimensions: readDimensions(),
        maxChars: DEFAULT_MAX_CHARS,
        overlapChars: DEFAULT_OVERLAP_CHARS,
        dryRun: false,
        check: false,
        initManifest: false,
        keepRunningLines: false,
        force: false,
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
            case "--pdf":
                args.pdf = next();
                break;
            case "--manifest":
                args.manifest = next();
                break;
            case "--out":
                args.out = next();
                break;
            case "--vectors-out":
                args.vectorsOut = next();
                break;
            case "--model":
                args.model = next();
                break;
            case "--dims": {
                const dimensions = Number(next());
                if (!Number.isInteger(dimensions) || dimensions <= 0) {
                    throw new Error("--dims must be a positive integer");
                }
                args.dimensions = dimensions;
                break;
            }
            case "--max-chars": {
                const maxChars = Number(next());
                if (!Number.isInteger(maxChars) || maxChars < 200) {
                    throw new Error("--max-chars must be an integer of at least 200");
                }
                args.maxChars = maxChars;
                break;
            }
            case "--overlap-chars": {
                const overlapChars = Number(next());
                if (!Number.isInteger(overlapChars) || overlapChars < 0) {
                    throw new Error("--overlap-chars must be a non-negative integer");
                }
                args.overlapChars = overlapChars;
                break;
            }
            case "--dry-run":
                args.dryRun = true;
                break;
            case "--check":
                args.check = true;
                break;
            case "--init-manifest":
                args.initManifest = true;
                break;
            case "--keep-running-lines":
                args.keepRunningLines = true;
                break;
            case "--force":
                args.force = true;
                break;
            case "--help":
            case "-h":
                args.help = true;
                break;
            default:
                throw new Error(`Unknown argument "${flag}"`);
        }
    }

    if (args.overlapChars >= args.maxChars / 2) {
        throw new Error("--overlap-chars must be less than half of --max-chars");
    }

    return args;
}

function printHelp(): void {
    console.log(`Export the PDF corpus to a JSON snapshot (debug tool).

Vectorize is the production store; this script emits the NDJSON for
`wrangler vectorize insert` (see --vectors-out). It also keeps the offline
preview, --check and --init-manifest workflows.

Usage:
  bun run rag:build -- --pdf data/corpus/corpus.pdf [options]

Options:
  --pdf <path>             PDF to ingest (required)
  --manifest <path>        Page map (default: ${DEFAULT_MANIFEST} when it exists)
  --out <path>             Snapshot output (default: ${DEFAULT_OUT})
  --vectors-out <path>     Vectorize NDJSON output (default: ${DEFAULT_VECTORS_OUT})
  --init-manifest          Write a page-per-section manifest skeleton and exit
  --dry-run                Extract and chunk without calling the gateway
  --check                  Exit 1 when the snapshot is stale for this PDF/manifest
  --model <name>           Embedding model (default: $LLM_EMBEDDING_MODEL or ${DEFAULT_MODEL})
  --dims <n>               Embedding dimensions (default: $LLM_EMBEDDING_DIMENSIONS or ${DEFAULT_DIMENSIONS})
  --max-chars <n>          Chunk cap in characters (default: ${DEFAULT_MAX_CHARS})
  --overlap-chars <n>      Chunk overlap in characters (default: ${DEFAULT_OVERLAP_CHARS})
  --keep-running-lines     Keep repeated headers, footers and page numbers
  --force                  Overwrite the manifest created by --init-manifest
  --help                   Show this help

Workflow:
  1. bun run rag:build -- --pdf <pdf> --init-manifest
  2. Group the pages into projects/sections in ${DEFAULT_MANIFEST}
  3. bun run rag:build -- --pdf <pdf> --dry-run
  4. bun run rag:build -- --pdf <pdf>  (emite el NDJSON para Vectorize)
`);
}

function preview(value: string): string {
    const firstLine = value.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
    return firstLine.length > PAGE_PREVIEW_CHARS
        ? `${firstLine.slice(0, PAGE_PREVIEW_CHARS)}…`
        : firstLine || "[no text]";
}

function previewText(value: string, length = 160): string {
    const collapsed = value.replace(/\s+/g, " ").trim();
    return collapsed.length > length ? `${collapsed.slice(0, length)}…` : collapsed;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function formatSize(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KB`;
}

function serializeIndex(index: CorpusIndex): string {
    const lines = [
        "{",
        `  "version": ${index.version},`,
        `  "embedding": ${JSON.stringify(index.embedding)},`,
        `  "chunking": ${JSON.stringify(index.chunking)},`,
        `  "source": ${JSON.stringify(index.source)},`,
        '  "chunks": [',
        index.chunks.map((chunk) => `    ${JSON.stringify(chunk)}`).join(",\n"),
        "  ]",
        "}",
    ];

    return `${lines.join("\n")}\n`;
}

async function writeManifestSkeleton(manifestPath: string, pages: string[], totalPages: number, force: boolean): Promise<void> {
    if (existsSync(manifestPath) && !force) {
        throw new Error(`${manifestPath} already exists; pass --force to overwrite it`);
    }

    const manifest: CorpusManifest = corpusManifestSchema.parse({
        locale: "es",
        sections: pages.map((_, index) => ({
            id: `page-${index + 1}`,
            title: `Page ${index + 1}`,
            section: "other",
            pages: String(index + 1),
        })),
        exclude: [],
        redact: [],
    });

    await mkdir(dirname(resolve(manifestPath)), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    console.log(`Wrote ${manifestPath} with ${totalPages} page-sections.`);
    console.log("Group the pages into project/section ranges, then run with --dry-run.\n");
    pages.forEach((page, index) => {
        const chars = page.length.toLocaleString("en-US");
        console.log(`  p.${String(index + 1).padStart(3, "0")}  ${chars.padStart(7)} chars  ${preview(page)}`);
    });
}

async function main(): Promise<void> {
    const args = parseArguments(process.argv.slice(2));

    if (args.help) {
        printHelp();
        return;
    }

    if (!args.pdf) {
        printHelp();
        throw new Error("--pdf is required");
    }

    if (args.initManifest) {
        const corpus = await loadCorpus({
            pdf: args.pdf,
            manifest: null,
            maxChars: args.maxChars,
            overlapChars: args.overlapChars,
            keepRunningLines: args.keepRunningLines,
        });

        await writeManifestSkeleton(
            resolve(args.manifest ?? DEFAULT_MANIFEST),
            corpus.pages,
            corpus.totalPages,
            args.force,
        );
        return;
    }

    const manifestPath = resolveManifestPath(args.manifest);
    const corpus = await loadCorpus({
        pdf: args.pdf,
        manifest: manifestPath,
        maxChars: args.maxChars,
        overlapChars: args.overlapChars,
        keepRunningLines: args.keepRunningLines,
    });

    if (manifestPath) {
        console.log(`manifest   ${manifestPath}`);
    } else {
        console.warn(`warning: no manifest found; chunks will have no projectId (expected ${DEFAULT_MANIFEST})`);
    }

    for (const warning of corpus.warnings) console.warn(`warning: ${warning}`);

    console.log(
        `pdf        ${corpus.totalPages} pages · ${formatSize(corpus.pdfBytes)} · sha ${corpus.pdfSha256.slice(0, 12)}`,
    );
    console.log(
        `chunks     ${corpus.chunks.length} · ${corpus.totalChars.toLocaleString("en-US")} chars · ~${corpus.totalTokens.toLocaleString("en-US")} tokens`,
    );
    console.log("");

    for (const section of corpus.sections) {
        const sectionChunks = corpus.chunks.filter((chunk) => chunk.id.startsWith(`${section.id}:`));
        const tokens = sectionChunks.reduce((sum, chunk) => sum + estimateTokens(chunk.text), 0);
        const pages = section.pages.length === 1 ? `${section.pages[0]}` : `${section.pages[0]}-${section.pages.at(-1)}`;
        console.log(
            `  ${section.id.padEnd(28)} p.${pages.padEnd(8)} ${String(sectionChunks.length).padStart(2)} chunks  ~${String(tokens).padStart(4)} tokens`,
        );
    }
    console.log("");

    if (args.check) {
        const outPath = resolve(args.out);

        if (!existsSync(outPath)) throw new Error(`no snapshot at ${outPath}; run without --check first`);

        const existing = corpusIndexSchema.parse(JSON.parse(await readFile(outPath, "utf8")));
        const differences: string[] = [];

        if (existing.source.sha256 !== corpus.pdfSha256) differences.push("pdf changed");
        if (existing.source.manifestSha256 !== corpus.manifestSha256) differences.push("manifest changed");
        if (existing.source.pages !== corpus.totalPages) differences.push("page count changed");
        if (existing.embedding.model !== args.model) differences.push("embedding model changed");
        if (existing.embedding.dimensions !== args.dimensions) differences.push("dimensions changed");
        if (existing.chunking.maxChars !== args.maxChars) differences.push("chunk size changed");
        if (existing.chunking.overlapChars !== args.overlapChars) differences.push("chunk overlap changed");
        if (existing.chunks.length !== corpus.chunks.length) differences.push("chunk count changed");

        if (differences.length) {
            console.error(`stale snapshot: ${differences.join(", ")}`);
            process.exitCode = 1;
        } else {
            console.log(`${args.out} is up to date`);
        }
        return;
    }

    if (args.dryRun) {
        console.log("dry run: no embeddings requested");
        for (const section of corpus.sections) {
            const first = corpus.chunks.find((chunk) => chunk.id.startsWith(`${section.id}:`));
            if (first) console.log(`\n[${first.id}] ${previewText(first.text)}`);
        }
        return;
    }

    const baseURL = process.env.LLM_BASE_URL;
    const apiKey = process.env.LLM_API_KEY;

    if (!baseURL || !apiKey) {
        throw new Error("LLM_BASE_URL and LLM_API_KEY are required (see .env.example)");
    }

    console.log(`embedding  ${corpus.chunks.length} chunks with ${args.model} (${Math.ceil(corpus.chunks.length / 32)} batches)...`);

    const { vectors, dimensions } = await embedTexts(
        // The title is part of the embedding so project names are searchable.
        corpus.chunks.map((chunk) => `${chunk.title}\n${chunk.text}`),
        {
            baseURL,
            apiKey,
            model: args.model,
            dimensions: args.dimensions,
        },
    );

    const index: CorpusIndex = {
        version: 1,
        embedding: { model: args.model, dimensions },
        chunking: { maxChars: args.maxChars, overlapChars: args.overlapChars },
        source: {
            sha256: corpus.pdfSha256,
            manifestSha256: corpus.manifestSha256,
            pages: corpus.totalPages,
            locale: corpus.manifest.locale,
        },
        chunks: corpus.chunks.map((chunk, position) => {
            const vector = vectors[position];
            if (!vector) throw new Error(`missing embedding for chunk ${chunk.id}`);

            return {
                ...chunk,
                vector: vector.map((value) => Math.round(value * 1e5) / 1e5),
            };
        }),
    };

    const parsed = corpusIndexSchema.safeParse(index);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .slice(0, 5)
            .map((issue) => `${issue.path.join(".") || "index"}: ${issue.message}`)
            .join("\n");
        throw new Error(`generated index is invalid:\n${issues}`);
    }

    const outPath = resolve(args.out);
    const temporaryPath = `${outPath}.tmp`;

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(temporaryPath, serializeIndex(parsed.data), "utf8");
    await rename(temporaryPath, outPath);

    const size = (await stat(outPath)).size;
    console.log(`wrote      ${args.out} · ${formatSize(size)} · ${index.chunks.length} chunks · ${dimensions} dims`);

    // Ingesta Vectorize (T4): una línea por chunk, lista para
    // `wrangler vectorize insert <index> --file <ndjson>`. Reusa los
    // embeddings ya calculados; no genera nada para otros stores.
    const vectorsPath = resolve(args.vectorsOut);
    const vectorsTemporaryPath = `${vectorsPath}.tmp`;
    const vectorsNdjson = parsed.data.chunks
        .map((chunk) =>
            JSON.stringify({
                id: chunk.id,
                values: chunk.vector,
                metadata: { text: chunk.text, source: args.pdf },
            }),
        )
        .join("\n");

    await mkdir(dirname(vectorsPath), { recursive: true });
    await writeFile(vectorsTemporaryPath, `${vectorsNdjson}\n`, "utf8");
    await rename(vectorsTemporaryPath, vectorsPath);

    const vectorsSize = (await stat(vectorsPath)).size;
    console.log(`wrote      ${args.vectorsOut} · ${formatSize(vectorsSize)} · ${index.chunks.length} vectors`);
}

main().catch((error: unknown) => {
    console.error(`error: ${errorMessage(error)}`);
    process.exitCode = 1;
});
