import { QdrantClient } from "@qdrant/js-client-rest";
import type { Schemas } from "@qdrant/js-client-rest";
import type { CorpusPoint } from "./points";
import type { SparseVector } from "./sparse";

const COLLECTION_NAME = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export interface QdrantConfig {
    url: string;
    apiKey?: string;
    /** Stable alias the app reads from; ingestion swaps it atomically. */
    alias: string;
}

export function readQdrantConfig(
    env: Record<string, string | undefined> = process.env,
): QdrantConfig {
    const url = env.QDRANT_URL?.trim();
    if (!url) throw new Error("QDRANT_URL is required");

    const alias = env.QDRANT_COLLECTION?.trim() || "portfolio_corpus";
    if (!COLLECTION_NAME.test(alias)) {
        throw new Error(
            `QDRANT_COLLECTION must be lowercase letters, digits, dashes or underscores (got "${alias}")`,
        );
    }

    return { url, apiKey: env.QDRANT_API_KEY?.trim() || undefined, alias };
}

export function createQdrantClient(config: QdrantConfig, timeoutMs = 15_000): QdrantClient {
    // The SDK falls back to :6333 when the URL has no explicit port, which breaks
    // instances published behind a reverse proxy on the scheme's default port.
    const url = new URL(config.url);
    const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;

    return new QdrantClient({
        url: config.url,
        port,
        apiKey: config.apiKey,
        timeout: timeoutMs,
        checkCompatibility: false,
    });
}

export function versionedCollectionName(alias: string, buildVersion: string): string {
    return `${alias}_${buildVersion.slice(0, 12)}`;
}

export async function collectionExists(client: QdrantClient, name: string): Promise<boolean> {
    const { exists } = await client.collectionExists(name);
    return exists;
}

export async function createCorpusCollection(
    client: QdrantClient,
    name: string,
    dimensions: number,
): Promise<void> {
    await client.createCollection(name, {
        vectors: { dense: { size: dimensions, distance: "Cosine" } },
        sparse_vectors: { sparse: { modifier: "idf" } },
    });
}

const INDEXED_FIELDS = ["chunkId", "projectId", "section"] as const;

export async function createCorpusIndexes(client: QdrantClient, name: string): Promise<void> {
    for (const fieldName of INDEXED_FIELDS) {
        await client.createPayloadIndex(name, {
            field_name: fieldName,
            field_schema: "keyword",
            wait: true,
        });
    }
}

export async function upsertCorpusPoints(
    client: QdrantClient,
    name: string,
    points: CorpusPoint[],
    batchSize = 64,
): Promise<void> {
    for (let offset = 0; offset < points.length; offset += batchSize) {
        await client.upsert(name, {
            wait: true,
            points: points.slice(offset, offset + batchSize).map(({ id, vector, payload }) => ({
                id,
                vector,
                payload: { ...payload },
            })),
        });
    }
}

export async function countPoints(client: QdrantClient, name: string): Promise<number> {
    const result = await client.count(name, { exact: true });
    return result.count;
}

export async function getAliasTarget(
    client: QdrantClient,
    alias: string,
): Promise<string | null> {
    const { aliases } = await client.getAliases();
    return aliases.find((entry) => entry.alias_name === alias)?.collection_name ?? null;
}

/**
 * The alias swap is one atomic request, so readers see either the old or the
 * new collection, never a missing alias. delete_alias is a no-op when absent.
 */
export async function swapAlias(
    client: QdrantClient,
    alias: string,
    collection: string,
): Promise<string | null> {
    const previous = await getAliasTarget(client, alias);
    const actions: Schemas["AliasOperations"][] = [];

    if (previous) actions.push({ delete_alias: { alias_name: alias } });
    actions.push({ create_alias: { collection_name: collection, alias_name: alias } });

    await client.updateCollectionAliases({ actions });
    return previous;
}

/** Deletes every `<alias>_<version>` collection that no alias points at. */
export async function pruneOldCollections(
    client: QdrantClient,
    alias: string,
): Promise<string[]> {
    const prefix = `${alias}_`;
    const [{ collections }, { aliases }] = await Promise.all([
        client.getCollections(),
        client.getAliases(),
    ]);

    const inUse = new Set(aliases.map((entry) => entry.collection_name));
    const stale = collections
        .map((entry) => entry.name)
        .filter((name) => name.startsWith(prefix) && !inUse.has(name));

    for (const name of stale) await client.deleteCollection(name);
    return stale;
}

export interface HybridQueryOptions {
    dense: number[];
    sparse: SparseVector;
    limit?: number;
    /** Candidates fetched per retriever before fusion. */
    prefetchLimit?: number;
    timeoutSeconds?: number;
}

export interface HybridHit {
    score: number;
    payload: Record<string, unknown>;
}

export async function queryHybrid(
    client: QdrantClient,
    collection: string,
    options: HybridQueryOptions,
): Promise<HybridHit[]> {
    const limit = options.limit ?? 12;
    const prefetchLimit = options.prefetchLimit ?? 24;
    const timeout = options.timeoutSeconds ?? 10;
    const withPayload = true;

    if (!options.sparse.indices.length) {
        const result = await client.query(collection, {
            query: options.dense,
            using: "dense",
            limit,
            with_payload: withPayload,
            with_vector: false,
            timeout,
        });
        return result.points.map((point) => ({ score: point.score, payload: point.payload ?? {} }));
    }

    const result = await client.query(collection, {
        prefetch: [
            { query: options.dense, using: "dense", limit: prefetchLimit },
            { query: options.sparse, using: "sparse", limit: prefetchLimit },
        ],
        query: { fusion: "rrf" },
        limit,
        with_payload: withPayload,
        with_vector: false,
        timeout,
    });

    return result.points.map((point) => ({ score: point.score, payload: point.payload ?? {} }));
}
