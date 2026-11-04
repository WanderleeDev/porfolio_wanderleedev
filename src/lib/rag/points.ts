import { createHash } from "node:crypto";
import type { CorpusChunkInput } from "./schema";
import { encodeSparse, type SparseVector } from "./sparse";

interface CorpusPointMeta {
    sourceSha256: string;
    embeddingModel: string;
    embeddingDimensions: number;
}

interface CorpusPointPayload {
    chunkId: string;
    projectId?: string;
    section: CorpusChunkInput["section"];
    title: string;
    pages: number[];
    text: string;
    sourceSha256: string;
    embeddingModel: string;
    embeddingDimensions: number;
}

export interface CorpusPoint {
    id: string;
    vector: { dense: number[]; sparse: SparseVector };
    payload: CorpusPointPayload;
}

/**
 * Deterministic UUIDv5-shaped ID. Re-running the same PDF produces the same
 * point IDs, so an unchanged chunk is overwritten instead of duplicated.
 */
export function pointId(sourceSha256: string, chunkId: string): string {
    const digest = createHash("sha256").update(`${sourceSha256}\n${chunkId}`).digest("hex");
    const variant = ((Number.parseInt(digest[16], 16) & 0x3) | 0x8).toString(16);

    return [
        digest.slice(0, 8),
        digest.slice(8, 12),
        `5${digest.slice(13, 16)}`,
        `${variant}${digest.slice(17, 20)}`,
        digest.slice(20, 32),
    ].join("-");
}

export function buildPoints(
    chunks: CorpusChunkInput[],
    denseVectors: number[][],
    meta: CorpusPointMeta,
): CorpusPoint[] {
    if (chunks.length !== denseVectors.length) {
        throw new Error(`expected ${chunks.length} dense vectors, got ${denseVectors.length}`);
    }

    return chunks.map((chunk, position) => {
        const dense = denseVectors[position];
        if (!dense) throw new Error(`missing dense vector for chunk "${chunk.id}"`);

        return {
            id: pointId(meta.sourceSha256, chunk.id),
            vector: {
                dense,
                sparse: encodeSparse(`${chunk.title}\n${chunk.text}`, "document"),
            },
            payload: {
                chunkId: chunk.id,
                ...(chunk.projectId ? { projectId: chunk.projectId } : {}),
                section: chunk.section,
                title: chunk.title,
                pages: chunk.pages,
                text: chunk.text,
                sourceSha256: meta.sourceSha256,
                embeddingModel: meta.embeddingModel,
                embeddingDimensions: meta.embeddingDimensions,
            },
        };
    });
}
