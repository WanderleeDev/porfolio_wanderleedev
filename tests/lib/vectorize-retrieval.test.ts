import { afterEach, describe, expect, mock, test } from "bun:test";

const ENV = {
    LLM_EMBEDDING_DIMENSIONS: 3,
    RAG_MIN_SCORE: 0.35,
};

mock.module("astro:env/server", () => ENV);

// El binding sólo existe en workerd; en el test se simula con un objeto
// mutable para que cada caso arme su propio índice falso. Sin binding
// (VECTORIZE ausente) el código sigue la misma rama que cuando el import
// dinámico falla en dev: getIndex devuelve null y se cae al fallback local.
const fakeEnv: { VECTORIZE?: unknown } = {};

mock.module("cloudflare:workers", () => ({
    env: fakeEnv,
}));

// El fallback de dev lee `data/rag-vectors.ndjson` con `node:fs/promises`
// importado de forma dinámica (para no romper en workerd); acá se stubbea
// ese módulo para probar la rama sin tocar el FS real.
const fakeFs: { ndjson: string } = { ndjson: "" };

mock.module("node:fs/promises", () => ({
    readFile: async () => fakeFs.ndjson,
}));

const { searchCorpus } = await import("../../src/lib/rag/vectorize");

function stubVectorize(matches: unknown) {
    const query = mock(async (_vector: number[], _options: unknown) => ({ matches }));
    fakeEnv.VECTORIZE = { query };
    return query;
}

afterEach(() => {
    fakeEnv.VECTORIZE = undefined;
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
});

describe("searchCorpus sin binding (fallback NDJSON de dev)", () => {
    fakeFs.ndjson = [
        JSON.stringify({ id: "a", values: [1, 0, 0], metadata: { text: "texto a", source: "s" } }),
        JSON.stringify({ id: "b", values: [0.9, 0.1, 0], metadata: { text: "texto b", source: "s" } }),
        JSON.stringify({ id: "c", values: [0, 1, 0], metadata: { text: "texto c", source: "s" } }),
        "línea rota",
        JSON.stringify({ id: "d", values: [1, 0, 0], metadata: { text: 42, source: "s" } }),
    ].join("\n");

    test("lee el NDJSON y ordena por similitud coseno", async () => {
        fakeEnv.VECTORIZE = undefined;

        const hits = await searchCorpus([1, 0, 0], 4);

        expect(hits).toEqual([
            { score: 1, texto: "texto a" },
            { score: 0.9, texto: "texto b" },
        ]);
    });

    test("filtra por RAG_MIN_SCORE, recorta a limit e ignora líneas rotas", async () => {
        fakeEnv.VECTORIZE = undefined;

        const hits = await searchCorpus([1, 0, 0], 1);

        expect(hits).toEqual([{ score: 1, texto: "texto a" }]);
    });

    test("otra query encuentra su propio vecino e ignora metadata sin texto", async () => {
        fakeEnv.VECTORIZE = undefined;

        const hits = await searchCorpus([0, 1, 0], 4);

        expect(hits).toEqual([{ score: 1, texto: "texto c" }]);
    });
});

describe("boost por keyword (T7)", () => {
    test("con binding: la pregunta con el nombre de un proyecto sube su chunk", async () => {
        stubVectorize([
            { score: 0.9, metadata: { text: "perfil general de wanderlee" } },
            { score: 0.85, metadata: { text: "proyecto clior-ecommerce con checkout" } },
        ]);

        const hits = await searchCorpus([0.1], 4, "contame del clior-ecommerce");

        expect(hits.map((hit) => hit.texto)).toEqual([
            "proyecto clior-ecommerce con checkout",
            "perfil general de wanderlee",
        ]);
    });

    test("las stopwords no cuentan para el boost", async () => {
        stubVectorize([
            { score: 0.9, metadata: { text: "que para con del los las" } },
            { score: 0.85, metadata: { text: "proyecto portfolio con astro" } },
        ]);

        const hits = await searchCorpus([0.1], 4, "que para con hola");

        expect(hits.map((hit) => hit.texto)).toEqual([
            "que para con del los las",
            "proyecto portfolio con astro",
        ]);
    });

    test("sin pregunta el orden no cambia", async () => {
        stubVectorize([
            { score: 0.9, metadata: { text: "primero" } },
            { score: 0.8, metadata: { text: "segundo" } },
        ]);

        expect(await searchCorpus([0.1], 4)).toEqual([
            { score: 0.9, texto: "primero" },
            { score: 0.8, texto: "segundo" },
        ]);
        expect(await searchCorpus([0.1], 4, "")).toEqual([
            { score: 0.9, texto: "primero" },
            { score: 0.8, texto: "segundo" },
        ]);
    });

    test("en el fallback local el boost no rompe el orden ni el limit", async () => {
        fakeEnv.VECTORIZE = undefined;

        // Ambos chunks comparten el token "texto" ("a"/"b" se filtran
        // por cortos): el boost empata y se conserva el orden denso.
        const hits = await searchCorpus([1, 0, 0], 4, "texto");

        expect(hits.map((hit) => hit.texto)).toEqual(["texto a", "texto b"]);

        // El slice a limit se aplica después del boost.
        const one = await searchCorpus([1, 0, 0], 1, "texto");
        expect(one).toEqual([{ score: 1, texto: "texto a" }]);
    });
});
