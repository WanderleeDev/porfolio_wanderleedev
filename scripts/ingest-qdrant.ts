import { embedTexts } from "../src/lib/rag/embed";
import {
    DEFAULT_MAX_CHARS,
    DEFAULT_OVERLAP_CHARS,
    loadCorpus,
    sha256,
    type LoadedCorpus,
} from "../src/lib/rag/corpus";
import { buildPoints, type CorpusPoint } from "../src/lib/rag/points";
import { SPARSE_ENCODER_VERSION } from "../src/lib/rag/sparse";
import {
    collectionExists,
    countPoints,
    createCorpusCollection,
    createCorpusIndexes,
    createQdrantClient,
    getAliasTarget,
    pruneOldCollections,
    readQdrantConfig,
    swapAlias,
    upsertCorpusPoints,
    versionedCollectionName,
} from "../src/lib/rag/qdrant";

const DEFAULT_MODEL = "qwen3-embedding:0.6b";
const DEFAULT_DIMENSIONS = 512;

interface Arguments {
    pdf?: string;
    manifest?: string | null;
    alias?: string;
    model: string;
    dimensions?: number;
    maxChars: number;
    overlapChars: number;
    batchSize: number;
    dryRun: boolean;
    force: boolean;
    prune: boolean;
    keepRunningLines: boolean;
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
        model: process.env.LLM_EMBEDDING_MODEL?.trim() || DEFAULT_MODEL,
        dimensions: readDimensions(),
        maxChars: DEFAULT_MAX_CHARS,
        overlapChars: DEFAULT_OVERLAP_CHARS,
        batchSize: 64,
        dryRun: false,
        force: false,
        prune: false,
        keepRunningLines: false,
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
            case "--alias":
                args.alias = next();
                break;
            case "--model":
                args.model = next();
                break;
            case "--dims": {
                const dimensions = integer(next(), flag);
                if (dimensions <= 0) throw new Error("--dims must be a positive integer");
                args.dimensions = dimensions;
                break;
            }
            case "--max-chars": {
                const maxChars = integer(next(), flag);
                if (maxChars < 200) throw new Error("--max-chars must be at least 200");
                args.maxChars = maxChars;
                break;
            }
            case "--overlap-chars": {
                const overlapChars = integer(next(), flag);
                if (overlapChars < 0) throw new Error("--overlap-chars must be non-negative");
                args.overlapChars = overlapChars;
                break;
            }
            case "--batch": {
                const batchSize = integer(next(), flag);
                if (batchSize < 1 || batchSize > 256) {
                    throw new Error("--batch must be between 1 and 256");
                }
                args.batchSize = batchSize;
                break;
            }
            case "--dry-run":
                args.dryRun = true;
                break;
            case "--force":
                args.force = true;
                break;
            case "--prune":
                args.prune = true;
                break;
            case "--keep-running-lines":
                args.keepRunningLines = true;
                break;
            case "--help":
            case "-h":
                args.help = true;
                break;
            default:
                throw new Error(`Unknown argument "${flag}"`);
        }
    }

    return args;
}

function integer(value: string, flag: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new Error(`${flag} must be an integer`);
    return parsed;
}

function printHelp(): void {
    console.log(`Ingest the PDF corpus into Qdrant (dense + sparse hybrid).

Usage:
  bun run rag:ingest -- --pdf data/corpus/corpus.pdf [options]

Options:
  --pdf <path>           PDF to ingest (required)
  --manifest <path>      Page map (default: data/corpus/manifest.json when present)
  --alias <name>         Alias the app reads (default: $QDRANT_COLLECTION or portfolio_corpus)
  --model <name>         Embedding model (default: $LLM_EMBEDDING_MODEL or ${DEFAULT_MODEL})
  --dims <n>             Embedding dimensions (default: $LLM_EMBEDDING_DIMENSIONS or ${DEFAULT_DIMENSIONS})
  --max-chars <n>        Chunk cap in characters (default: ${DEFAULT_MAX_CHARS})
  --overlap-chars <n>    Chunk overlap in characters (default: ${DEFAULT_OVERLAP_CHARS})
  --batch <n>            Points per upsert batch (default: 64)
  --dry-run              Extract, chunk and encode locally; no network calls
  --force                Rebuild the versioned collection if it already exists
  --prune                Delete old versioned collections after the alias swap
  --keep-running-lines   Keep repeated headers, footers and page numbers
  --help                 Show this help

Required environment (never commit these):
  QDRANT_URL, QDRANT_API_KEY
  LLM_BASE_URL, LLM_API_KEY

The ingest writes to a content-addressed collection (alias_<hash>), verifies the
point count and then swaps the alias atomically, so the site can keep querying
while a new corpus is uploaded.
`);
}

function buildVersion(
    corpus: LoadedCorpus,
    args: Arguments,
    dimensions: number,
): string {
    return sha256(
        JSON.stringify({
            pdf: corpus.pdfSha256,
            manifest: corpus.manifestSha256,
            maxChars: args.maxChars,
            overlapChars: args.overlapChars,
            sparseEncoder: SPARSE_ENCODER_VERSION,
            model: args.model,
            dimensions,
        }),
    );
}

function formatSize(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KB`;
}

function preview(value: string, length = 180): string {
    const collapsed = value.replace(/\s+/g, " ").trim();
    return collapsed.length > length ? `${collapsed.slice(0, length)}…` : collapsed;
}

function printCorpusBuild(corpus: LoadedCorpus): void {
    console.log(
        `pdf        ${corpus.totalPages} pages · ${formatSize(corpus.pdfBytes)} · sha ${corpus.pdfSha256.slice(0, 12)}`,
    );
    console.log(
        `chunks     ${corpus.chunks.length} · ${corpus.totalChars.toLocaleString("en-US")} chars · ~${corpus.totalTokens.toLocaleString("en-US")} tokens`,
    );

    for (const warning of corpus.warnings) console.warn(`warning: ${warning}`);

    console.log("");
    for (const section of corpus.sections) {
        const chunks = corpus.chunks.filter((chunk) => chunk.id.startsWith(`${section.id}:`));
        const pages = section.pages.length === 1
            ? `${section.pages[0]}`
            : `${section.pages[0]}-${section.pages.at(-1)}`;

        console.log(
            `  ${section.id.padEnd(28)} p.${pages.padEnd(8)} ${String(chunks.length).padStart(2)} chunks`,
        );
    }
    console.log("");
}

function printSample(points: CorpusPoint[]): void {
    const sample = points[0];
    if (!sample) return;

    console.log(`sample     ${sample.payload.chunkId} → ${sample.id}`);
    console.log(`           ${sample.vector.dense.length} dense dims · ${sample.vector.sparse.indices.length} sparse terms`);
    console.log(`           ${preview(`${sample.payload.title} — ${sample.payload.text}`)}`);
    console.log("");
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

    const alias = args.alias?.trim() || process.env.QDRANT_COLLECTION?.trim() || "portfolio_corpus";
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(alias)) {
        throw new Error(
            `the collection alias must be lowercase letters, digits, dashes or underscores (got "${alias}")`,
        );
    }

    const corpus = await loadCorpus({
        pdf: args.pdf,
        manifest: args.manifest,
        maxChars: args.maxChars,
        overlapChars: args.overlapChars,
        keepRunningLines: args.keepRunningLines,
    });

    printCorpusBuild(corpus);

    if (args.dryRun) {
        const dimensions = args.dimensions ?? DEFAULT_DIMENSIONS;
        const version = buildVersion(corpus, args, dimensions);
        console.log(`alias      ${alias}`);
        console.log(`collection ${versionedCollectionName(alias, version)} (dry run; not created)`);
        console.log(`embedding  ${args.model} · ${dimensions} dims`);
        console.log(`sparse     local BM25 terms, Qdrant applies IDF\n`);
        console.log("dry run: no embeddings requested and no Qdrant calls made");
        return;
    }

    const config = readQdrantConfig({ ...process.env, QDRANT_COLLECTION: alias });

    const baseURL = process.env.LLM_BASE_URL;
    const apiKey = process.env.LLM_API_KEY;
    if (!baseURL || !apiKey) {
        throw new Error("LLM_BASE_URL and LLM_API_KEY are required (see .env.example)");
    }

    console.log(`embedding  ${corpus.chunks.length} chunks with ${args.model}...`);

    const embedded = await embedTexts(
        corpus.chunks.map((chunk) => `${chunk.title}\n${chunk.text}`),
        {
            baseURL,
            apiKey,
            model: args.model,
            dimensions: args.dimensions,
        },
    );

    if (args.dimensions && embedded.dimensions !== args.dimensions) {
        throw new Error(`expected ${args.dimensions} dimensions, got ${embedded.dimensions}`);
    }

    const version = buildVersion(corpus, args, embedded.dimensions);
    const collection = versionedCollectionName(config.alias, version);

    const points = buildPoints(corpus.chunks, embedded.vectors, {
        sourceSha256: corpus.pdfSha256,
        embeddingModel: args.model,
        embeddingDimensions: embedded.dimensions,
    });

    printSample(points);

    const client = createQdrantClient(config);
    const exists = await collectionExists(client, collection);
    let needsUpload = true;
    let needsCreate = !exists;

    if (exists) {
        const count = await countPoints(client, collection);
        if (!args.force && count === points.length) {
            console.log(`reusing    ${collection} (${count} points already uploaded)`);
            needsUpload = false;
        } else if (!args.force) {
            throw new Error(
                `${collection} exists with ${count}/${points.length} points; pass --force to rebuild it`,
            );
        } else {
            const active = await getAliasTarget(client, config.alias);

            if (active === collection) {
                // Re-upsert in place: deleting the live collection would leave the alias dangling.
                console.log(`rebuilding ${collection} in place (${count}/${points.length} points)`);
            } else {
                console.log(`recreating ${collection}`);
                await client.deleteCollection(collection);
                needsCreate = true;
            }
        }
    }

    if (needsUpload) {
        if (needsCreate) {
            console.log(`collection ${collection} (${embedded.dimensions} dense dims + idf sparse)`);
            await createCorpusCollection(client, collection, embedded.dimensions);
            await createCorpusIndexes(client, collection);
        }

        console.log(`uploading  ${points.length} points in batches of ${args.batchSize}...`);
        await upsertCorpusPoints(client, collection, points, args.batchSize);

        const count = await countPoints(client, collection);
        if (count !== points.length) {
            throw new Error(`upload verification failed: ${count}/${points.length} points`);
        }
        console.log(`verified   ${count} points`);
    }

    const previous = await swapAlias(client, config.alias, collection);
    console.log(
        previous && previous !== collection
            ? `alias      ${config.alias} → ${collection} (was ${previous})`
            : `alias      ${config.alias} → ${collection}`,
    );

    if (args.prune) {
        const removed = await pruneOldCollections(client, config.alias);
        console.log(
            removed.length
                ? `pruned     ${removed.join(", ")}`
                : "pruned     nothing (no unreferenced versions)",
        );
    } else if (previous && previous !== collection) {
        console.log(`hint: keep ${previous} for rollback or rerun with --prune to delete it`);
    }

    const active = await getAliasTarget(client, config.alias);
    if (active !== collection) {
        throw new Error(`alias verification failed: ${active ?? "missing"} != ${collection}`);
    }

    console.log(`done       ${points.length} chunks · ${embedded.dimensions} dims · alias ${config.alias}`);
}

main().catch((error: unknown) => {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
});
