import { afterEach, describe, expect, mock, test } from "bun:test";

const ENV = {
    QDRANT_URL: "https://qdrant.example.com",
    QDRANT_COLLECTION: "portfolio_corpus",
    QDRANT_API_KEY: "test-api-key",
    LLM_EMBEDDING_DIMENSIONS: 512,
    RAG_MIN_SCORE: 0.35,
};

mock.module("astro:env/server", () => ENV);

// El binding sólo existe en workerd; en el test se simula con un objeto
// mutable para que cada caso arme su propio índice falso. Sin binding
// (VECTORIZE ausente) el código sigue la misma rama que cuando el import
// dinámico falla en dev: getIndex devuelve null y se cae al fallback.
const fakeEnv: { VECTORIZE?: unknown } = {};

mock.module("cloudflare:workers", () => ({
    env: fakeEnv,
}));

const { searchCorpus } = await import("../../src/lib/rag/vectorize");

function stubVectorize(matches: unknown) {
    const query = mock(async (_vector: number[], _options: unknown) => ({ matches }));
    fakeEnv.VECTORIZE = { query };
    return query;
}

const originalFetch = globalThis.fetch;

afterEach(() => {
    fakeEnv.VECTORIZE = undefined;
    globalThis.fetch = originalFetch;
});

describe("searchCorpus sobre Vectorize", () => {
    test("con binding: llama a query con topK amplio y returnMetadata all", async () => {
        const query = stubVectorize([]);
        const embedding = [0.1, 0.2, 0.3];

        await searchCorpus(embedding, 4);

        expect(query).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledWith(embedding, {
            topK: 20,
            returnMetadata: "all",
        });
    });

    test("filtra por RAG_MIN_SCORE y recorta a limit", async () => {
        stubVectorize([
            { score: 0.9, metadata: { text: "primero" } },
            { score: 0.8, metadata: { text: "segundo" } },
            { score: 0.7, metadata: { text: "tercero" } },
            { score: 0.2, metadata: { text: "bajo puntaje" } },
        ]);

        const hits = await searchCorpus([0.1], 2);

        expect(hits).toEqual([
            { score: 0.9, texto: "primero" },
            { score: 0.8, texto: "segundo" },
        ]);
    });

    test("descarta matches sin metadata.text string", async () => {
        stubVectorize([
            { score: 0.9, metadata: { text: "válido" } },
            { score: 0.8, metadata: {} },
            { score: 0.7, metadata: { text: 42 } },
            { score: 0.6 },
            { score: 0.95, metadata: null },
            "no-es-un-objeto",
        ]);

        const hits = await searchCorpus([0.1]);

        expect(hits).toEqual([{ score: 0.9, texto: "válido" }]);
    });

    test("sin binding: cae al fallback de Qdrant y devuelve su resultado", async () => {
        fakeEnv.VECTORIZE = undefined;
        let requestedUrl: string | null = null;
        globalThis.fetch = (async (input: string | URL | Request) => {
            const request = input instanceof Request ? input : new Request(input);
            requestedUrl = request.url;
            return Response.json({
                result: { points: [{ score: 0.9, payload: { texto: "desde qdrant" } }] },
            });
        }) as typeof fetch;

        const hits = await searchCorpus([0.1, 0.2], 3);

        expect(requestedUrl).toBe(
            "https://qdrant.example.com/collections/portfolio_corpus/points/query",
        );
        expect(hits).toEqual([{ score: 0.9, texto: "desde qdrant" }]);
    });
});
