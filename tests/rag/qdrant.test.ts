import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { QdrantClient } from "@qdrant/js-client-rest";
import { buildPoints } from "../../src/lib/rag/points";
import {
    countPoints,
    createCorpusCollection,
    createCorpusIndexes,
    createQdrantClient,
    getAliasTarget,
    pruneOldCollections,
    queryHybrid,
    swapAlias,
    upsertCorpusPoints,
} from "../../src/lib/rag/qdrant";

interface CapturedRequest {
    method: string;
    path: string;
    body: Record<string, unknown> | null;
}

let requests: CapturedRequest[] = [];
let aliases: { alias_name: string; collection_name: string }[] = [];
let collections: { name: string }[] = [];
let pointCount = 0;

const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request: Request) {
        const url = new URL(request.url);
        const body =
            request.method === "PUT" || request.method === "POST"
                ? ((await request.json().catch(() => null)) as Record<string, unknown> | null)
                : null;

        requests.push({ method: request.method, path: url.pathname, body });

        if (url.pathname.endsWith("/exists")) return Response.json({ result: { exists: false } });
        if (url.pathname === "/aliases" && request.method === "GET") {
            return Response.json({ result: { aliases } });
        }
        if (url.pathname === "/aliases" && request.method === "POST") return Response.json({ result: true });
        if (url.pathname === "/collections" && request.method === "GET") {
            return Response.json({ result: { collections } });
        }
        if (url.pathname.endsWith("/count")) return Response.json({ result: { count: pointCount } });
        if (url.pathname.endsWith("/query")) {
            return Response.json({
                result: {
                    points: [
                        {
                            id: "00000000-0000-5000-8000-000000000000",
                            version: 0,
                            score: 0.5,
                            payload: { chunkId: "clior:1", section: "summary", title: "Clior", pages: [7], text: "text" },
                        },
                    ],
                },
            });
        }
        if (url.pathname.endsWith("/index") || url.pathname.endsWith("/points")) {
            return Response.json({ result: { operation_id: 0, status: "completed" } });
        }
        if (request.method === "DELETE") return Response.json({ result: true });

        return Response.json({ result: true });
    },
});

const client = new QdrantClient({ url: `http://127.0.0.1:${server.port}`, checkCompatibility: false });
const alias = "test_corpus";

beforeEach(() => {
    requests = [];
    aliases = [];
    collections = [];
    pointCount = 0;
});

afterAll(() => server.stop(true));

describe("createQdrantClient", () => {
    test("uses the scheme default port instead of the SDK's 6333 fallback", async () => {
        const original = globalThis.fetch;
        let requested = "";

        globalThis.fetch = (async (input: string | URL | Request) => {
            requested = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
            return Response.json({ result: { collections: [] } });
        }) as typeof fetch;

        try {
            const client = createQdrantClient({ url: "https://qdrant.example.com", alias });

            await client.getCollections();
        } finally {
            globalThis.fetch = original;
        }

        expect(requested).toBe("https://qdrant.example.com:443/collections");
    });
});

describe("createCorpusCollection", () => {
    test("configures a named dense vector and an IDF sparse vector", async () => {
        await createCorpusCollection(client, "test_corpus_abc", 512);

        const request = requests.find((entry) => entry.method === "PUT");
        expect(request?.path).toBe("/collections/test_corpus_abc");
        expect(request?.body).toMatchObject({
            vectors: { dense: { size: 512, distance: "Cosine" } },
            sparse_vectors: { sparse: { modifier: "idf" } },
        });
    });
});

describe("createCorpusIndexes", () => {
    test("indexes the filterable payload fields", async () => {
        await createCorpusIndexes(client, "test_corpus_abc");

        const fields = requests
            .filter((entry) => entry.path.endsWith("/index"))
            .map((entry) => entry.body?.field_name);

        expect(fields).toEqual(["chunkId", "projectId", "section"]);
        expect(requests.every((entry) => entry.body?.field_schema === "keyword")).toBe(true);
    });
});

describe("upsertCorpusPoints", () => {
    test("sends dense and sparse vectors with the stored payload", async () => {
        const points = buildPoints(
            [
                {
                    id: "clior:1",
                    projectId: "clior",
                    section: "summary",
                    title: "Clior",
                    pages: [7],
                    text: "Angular and NestJS",
                },
            ],
            [[1, 0, 0]],
            { sourceSha256: "a".repeat(64), embeddingModel: "embed", embeddingDimensions: 3 },
        );

        await upsertCorpusPoints(client, "test_corpus_abc", points, 10);

        const body = requests.find((entry) => entry.path.endsWith("/points"))?.body;
        const sent = (body?.points as Record<string, unknown>[])[0];
        expect(sent?.vector).toMatchObject({ dense: [1, 0, 0] });
        expect((sent?.vector as { sparse: { indices: number[] } }).sparse.indices.length).toBeGreaterThan(0);
        expect(sent?.payload).toMatchObject({ chunkId: "clior:1", section: "summary", title: "Clior" });
    });

    test("batches large uploads", async () => {
        const chunk = {
            id: "a:1",
            section: "summary" as const,
            title: "A",
            pages: [1],
            text: "text",
        };
        const points = buildPoints([chunk, { ...chunk, id: "a:2" }, { ...chunk, id: "a:3" }], [[1], [1], [1]], {
            sourceSha256: "a".repeat(64),
            embeddingModel: "embed",
            embeddingDimensions: 1,
        });

        await upsertCorpusPoints(client, "test_corpus_abc", points, 2);

        expect(requests.filter((entry) => entry.path.endsWith("/points"))).toHaveLength(2);
    });
});

describe("aliases", () => {
    test("swaps an existing alias atomically, removing it before creating the new one", async () => {
        aliases = [{ alias_name: alias, collection_name: "test_corpus_old" }];

        const previous = await swapAlias(client, alias, "test_corpus_new");

        expect(previous).toBe("test_corpus_old");
        const body = requests.find((entry) => entry.method === "POST" && entry.path.endsWith("/aliases"))?.body;
        expect(body?.actions).toEqual([
            { delete_alias: { alias_name: alias } },
            { create_alias: { collection_name: "test_corpus_new", alias_name: alias } },
        ]);
    });

    test("creates the alias without a delete when it does not exist", async () => {
        await swapAlias(client, alias, "test_corpus_new");

        const body = requests.find((entry) => entry.method === "POST" && entry.path.endsWith("/aliases"))?.body;
        expect(body?.actions).toEqual([
            { create_alias: { collection_name: "test_corpus_new", alias_name: alias } },
        ]);
    });

    test("reads the current target", async () => {
        aliases = [{ alias_name: alias, collection_name: "test_corpus_old" }];
        expect(await getAliasTarget(client, alias)).toBe("test_corpus_old");
    });

    test("prunes unreferenced versions and keeps aliased ones", async () => {
        aliases = [{ alias_name: alias, collection_name: "test_corpus_old" }];
        collections = [{ name: "test_corpus_old" }, { name: "test_corpus_stale" }, { name: "other" }];

        const removed = await pruneOldCollections(client, alias);

        expect(removed).toEqual(["test_corpus_stale"]);
        const deleted = requests.filter((entry) => entry.method === "DELETE").map((entry) => entry.path);
        expect(deleted).toEqual(["/collections/test_corpus_stale"]);
    });
});

describe("queryHybrid", () => {
    test("fuses dense and sparse prefetches with RRF", async () => {
        const hits = await queryHybrid(client, alias, {
            dense: [1, 0],
            sparse: { indices: [10, 20], values: [1, 1] },
            limit: 12,
            prefetchLimit: 24,
        });

        expect(hits[0]?.score).toBe(0.5);
        const body = requests.find((entry) => entry.path.endsWith("/query"))?.body;
        expect(body).toMatchObject({
            query: { fusion: "rrf" },
            limit: 12,
            with_payload: true,
            with_vector: false,
        });
        expect(body?.prefetch).toEqual([
            { query: [1, 0], using: "dense", limit: 24 },
            { query: { indices: [10, 20], values: [1, 1] }, using: "sparse", limit: 24 },
        ]);
    });

    test("falls back to a dense-only query when no term survives", async () => {
        await queryHybrid(client, alias, {
            dense: [1, 0],
            sparse: { indices: [], values: [] },
        });

        const body = requests.find((entry) => entry.path.endsWith("/query"))?.body;
        expect(body).toMatchObject({ query: [1, 0], using: "dense" });
        expect(body?.prefetch).toBeUndefined();
    });
});

describe("countPoints", () => {
    test("returns the exact count", async () => {
        pointCount = 7;
        expect(await countPoints(client, "test_corpus_abc")).toBe(7);
    });
});
