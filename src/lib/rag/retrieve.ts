import type { QdrantClient } from "@qdrant/js-client-rest";
import { embedTexts, type EmbeddingOptions } from "./embed";
import { queryHybrid, type HybridHit } from "./qdrant";
import { corpusPayloadSchema, type CorpusPayload } from "./schema";
import { encodeSparse } from "./sparse";

export interface RetrievedChunk {
    id: string;
    projectId?: string;
    section: CorpusPayload["section"];
    title: string;
    pages: number[];
    text: string;
    score: number;
}

export interface SelectOptions {
    limit?: number;
    /** Caps how many chunks one project can contribute after fusion. */
    maxPerProject?: number;
}

export function selectChunks(hits: HybridHit[], options: SelectOptions = {}): RetrievedChunk[] {
    const limit = options.limit ?? 8;
    const maxPerGroup = options.maxPerProject ?? 2;
    const used = new Map<string, number>();
    const selected: RetrievedChunk[] = [];

    for (const hit of hits) {
        const parsed = corpusPayloadSchema.safeParse(hit.payload);
        if (!parsed.success) continue;

        const { chunkId, projectId, section, title, pages, text } = parsed.data;
        const group = projectId ?? `section:${section}`;
        const count = used.get(group) ?? 0;
        if (count >= maxPerGroup) continue;

        used.set(group, count + 1);
        selected.push({
            id: chunkId,
            ...(projectId ? { projectId } : {}),
            section,
            title,
            pages,
            text,
            score: hit.score,
        });

        if (selected.length >= limit) break;
    }

    return selected;
}

export interface FormatOptions {
    /** Keeps the excerpt context inside the model's window; chunks arrive up to 1800 chars. */
    maxCharsPerChunk?: number;
}

export function formatContext(chunks: RetrievedChunk[], options: FormatOptions = {}): string {
    return chunks
        .map((chunk, position) => {
            const first = chunk.pages[0];
            const last = chunk.pages.at(-1);
            const pages = first === last ? `${first}` : `${first}-${last}`;
            const owner = chunk.projectId ? `${chunk.projectId} · ` : "";
            const max = options.maxCharsPerChunk;
            const text = max && chunk.text.length > max
                ? `${chunk.text.slice(0, max).trimEnd()}…`
                : chunk.text;

            return `[${position + 1}] ${owner}${chunk.title} · ${chunk.section} · p.${pages}\n${text}`;
        })
        .join("\n\n");
}

export interface RetrieveOptions {
    client: QdrantClient;
    collection: string;
    embedding: EmbeddingOptions;
    limit?: number;
    maxPerProject?: number;
    maxCharsPerChunk?: number;
    prefetchLimit?: number;
    /** Fail fast: a chat request should not wait on a slow embedding gateway. */
    embeddingTimeoutMs?: number;
    embeddingRetries?: number;
    queryTimeoutSeconds?: number;
}

export interface RetrievalResult {
    chunks: RetrievedChunk[];
    context: string;
}

/**
 * One embedding call plus one hybrid query. Callers run this before
 * `streamText` so the answer still fits in a single generation.
 */
export async function retrieveCorpus(
    query: string,
    options: RetrieveOptions,
): Promise<RetrievalResult> {
    const trimmed = query.trim();
    if (!trimmed) return { chunks: [], context: "" };

    const limit = options.limit ?? 8;
    const { vectors } = await embedTexts([trimmed], {
        ...options.embedding,
        timeoutMs: options.embeddingTimeoutMs ?? 8_000,
        retries: options.embeddingRetries ?? 0,
    });
    const dense = vectors[0];
    if (!dense) return { chunks: [], context: "" };

    const hits = await queryHybrid(options.client, options.collection, {
        dense,
        sparse: encodeSparse(trimmed, "query"),
        limit: Math.max(limit * 3, 24),
        prefetchLimit: options.prefetchLimit,
        timeoutSeconds: options.queryTimeoutSeconds ?? 5,
    });

    const chunks = selectChunks(hits, { limit, maxPerProject: options.maxPerProject });
    return {
        chunks,
        context: formatContext(chunks, { maxCharsPerChunk: options.maxCharsPerChunk }),
    };
}
