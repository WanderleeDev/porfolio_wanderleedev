import { describe, expect, test } from "bun:test";
import { encodeSparse, tokenize } from "../../src/lib/rag/sparse";

function sharedIndices(left: ReturnType<typeof encodeSparse>, right: ReturnType<typeof encodeSparse>) {
    const leftSet = new Set(left.indices);
    return right.indices.filter((index) => leftSet.has(index));
}

describe("tokenize", () => {
    test("folds accents and lowercases", () => {
        expect(tokenize("Aplicación APLICACION")).toEqual(["aplicacion", "aplicacion"]);
    });

    test("drops Spanish and English stopwords", () => {
        const tokens = tokenize("el proyecto con the stack and the database");
        expect(tokens).not.toContain("el");
        expect(tokens).not.toContain("con");
        expect(tokens).not.toContain("the");
        expect(tokens).not.toContain("and");
        expect(tokens).toContain("proyecto");
        expect(tokens).toContain("stack");
    });

    test("indexes a compound whole, joined and split", () => {
        const tokens = tokenize("Next.js");
        expect(tokens).toContain("next.js");
        expect(tokens).toContain("nextjs");
        expect(tokens).toContain("next");
        expect(tokens).toContain("js");
    });

    test("keeps short technology names and symbols", () => {
        expect(tokenize("IA ML C++ C#")).toEqual(["ia", "ml", "c++", "c#"]);
    });

    test("trims sentence punctuation", () => {
        expect(tokenize("Angular.")).toEqual(["angular"]);
    });

    test("drops oversized tokens such as URLs or hashes", () => {
        expect(tokenize("a".repeat(41))).toEqual([]);
        expect(tokenize("a".repeat(40))).toEqual(["a".repeat(40)]);
    });

    test("returns nothing for punctuation and stopwords", () => {
        expect(tokenize("¿Y el de la?")).toEqual([]);
    });
});

describe("encodeSparse", () => {
    test("is deterministic", () => {
        const first = encodeSparse("Proyectos con Angular y NgRx");
        const second = encodeSparse("Proyectos con Angular y NgRx");
        expect(second).toEqual(first);
    });

    test("returns sorted unique indices with positive values", () => {
        const vector = encodeSparse("Angular Angular NgRx NestJS PostgreSQL");
        expect(vector.indices.length).toBeGreaterThan(0);
        expect(new Set(vector.indices).size).toBe(vector.indices.length);
        expect([...vector.indices].sort((a, b) => a - b)).toEqual(vector.indices);
        expect(vector.values.every((value) => value > 0)).toBe(true);
    });

    test("increases the weight of a repeated term", () => {
        const once = encodeSparse("angular");
        const twice = encodeSparse("angular angular");

        expect(once.indices).toEqual(twice.indices);
        expect(twice.values[0]).toBeGreaterThan(once.values[0]);
    });

    test("query mode ignores term frequency", () => {
        const once = encodeSparse("angular", "query");
        const twice = encodeSparse("angular angular", "query");

        expect(once).toEqual(twice);
    });

    test("returns an empty vector when no term survives", () => {
        expect(encodeSparse("de la y el")).toEqual({ indices: [], values: [] });
        expect(encodeSparse("")).toEqual({ indices: [], values: [] });
    });

    test("matches a hyphenated and a joined query against the document", () => {
        const document = encodeSparse("Experiencia con Next.js y Node.js");
        const spaced = encodeSparse("next js", "query");
        const joined = encodeSparse("nextjs", "query");

        expect(sharedIndices(document, spaced).length).toBeGreaterThan(0);
        expect(sharedIndices(document, joined).length).toBeGreaterThan(0);
    });
});
