import { afterEach, describe, expect, mock, test } from "bun:test";

const ENV = {
    QDRANT_URL: "https://qdrant.example.com",
    QDRANT_COLLECTION: "portfolio_corpus",
    QDRANT_API_KEY: "test-api-key",
    RAG_MIN_SCORE: 0.35,
};

mock.module("astro:env/server", () => ENV);

const { searchCorpus } = await import("../../src/lib/qdrant");

interface CapturedRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: Record<string, unknown> | null;
}

let captured: CapturedRequest | null = null;
let nextResponse: Response = Response.json({ result: { points: [] } });

const originalFetch = globalThis.fetch;

function stubFetch() {
    captured = null;
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        captured = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: (await request.json().catch(() => null)) as Record<string, unknown> | null,
        };
        return nextResponse;
    }) as typeof fetch;
}

afterEach(() => {
    globalThis.fetch = originalFetch;
    nextResponse = Response.json({ result: { points: [] } });
});

describe("searchCorpus", () => {
    test("queries the collection points endpoint with the embedding and score threshold", async () => {
        stubFetch();

        await searchCorpus([0.1, 0.2], 4);

        expect(captured?.url).toBe(
            "https://qdrant.example.com/collections/portfolio_corpus/points/query",
        );
        expect(captured?.method).toBe("POST");
        expect(captured?.headers["content-type"]).toContain("application/json");
        expect(captured?.headers["api-key"]).toBe("test-api-key");
        expect(captured?.body).toEqual({
            query: [0.1, 0.2],
            limit: 4,
            with_payload: true,
            score_threshold: 0.35,
        });
    });

    test("maps scored points with texto payloads to corpus hits", async () => {
        stubFetch();
        nextResponse = Response.json({
            result: {
                points: [
                    { score: 0.9, payload: { texto: "primer fragmento" } },
                    { score: 0.7, payload: { texto: "segundo fragmento" } },
                ],
            },
        });

        const hits = await searchCorpus([0.1, 0.2]);

        expect(hits).toEqual([
            { score: 0.9, texto: "primer fragmento" },
            { score: 0.7, texto: "segundo fragmento" },
        ]);
    });

    test("discards points without a texto string payload", async () => {
        stubFetch();
        nextResponse = Response.json({
            result: {
                points: [
                    { score: 0.9, payload: { texto: "válido" } },
                    { score: 0.8, payload: {} },
                    { score: 0.7, payload: { texto: 42 } },
                    { score: 0.6 },
                ],
            },
        });

        const hits = await searchCorpus([0.1, 0.2]);

        expect(hits).toEqual([{ score: 0.9, texto: "válido" }]);
    });

    test("throws a diagnosable error when Qdrant answers with a failure status", async () => {
        stubFetch();
        nextResponse = new Response("internal error", { status: 500 });

        const error = await searchCorpus([0.1, 0.2]).catch((cause: unknown) => cause);

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("500");
    });
});
