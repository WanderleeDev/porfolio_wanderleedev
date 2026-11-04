import { describe, expect, test } from "bun:test";
import { corpusManifestSchema } from "../../src/lib/rag/schema";
import {
    applyRedactions,
    buildSectionSources,
    chunkText,
    normalizeText,
    parsePageRange,
    removePageNumberLines,
    stripRunningLines,
} from "../../src/lib/rag/text";

describe("normalizeText", () => {
    test("rejoins a word broken at the end of a line", () => {
        expect(normalizeText("Desa-\nrrollo")).toBe("Desarrollo");
    });

    test("keeps hyphens that are part of a name", () => {
        expect(normalizeText("NestJS-\nBased")).toBe("NestJS-\nBased");
    });

    test("drops soft hyphens and normalizes whitespace", () => {
        expect(normalizeText("a\u00ad b\t c\r\n\r\n\r\n d")).toBe("a b c\n\nd");
    });
});

describe("chunkText", () => {
    test("splits long text under the cap", () => {
        const text = "Frase de prueba con contenido suficiente para el corpus. ".repeat(200);
        const chunks = chunkText(text, { maxChars: 400, overlapChars: 100 });

        expect(chunks.length).toBeGreaterThan(1);
        for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(400);
    });

    test("carries the tail of the previous chunk into the next one", () => {
        const text = "Frase de prueba con contenido suficiente para el corpus. ".repeat(200);
        const chunks = chunkText(text, { maxChars: 400, overlapChars: 100 });

        expect(chunks[1]).toContain(chunks[0].slice(-60));
    });

    test("hard-splits a single oversized word", () => {
        const chunks = chunkText("x".repeat(1000), { maxChars: 300, overlapChars: 0 });

        expect(chunks.every((chunk) => chunk.length <= 300)).toBe(true);
        expect(chunks.join("")).toBe("x".repeat(1000));
    });

    test("rejects an overlap larger than half the chunk", () => {
        expect(() => chunkText("texto", { maxChars: 200, overlapChars: 150 })).toThrow();
    });

    test("rejects non-finite chunk sizes", () => {
        expect(() => chunkText("texto", { maxChars: Number.NaN })).toThrow();
        expect(() => chunkText("texto", { overlapChars: Number.NaN })).toThrow();
    });
});

describe("parsePageRange", () => {
    test("expands ranges and single pages", () => {
        expect(parsePageRange("2-4", 10)).toEqual([2, 3, 4]);
        expect(parsePageRange("3", 10)).toEqual([3]);
    });

    test("rejects ranges outside the document", () => {
        expect(() => parsePageRange("0-2", 10)).toThrow();
        expect(() => parsePageRange("5-3", 10)).toThrow();
        expect(() => parsePageRange("3-20", 10)).toThrow();
    });
});

describe("removePageNumberLines", () => {
    test("drops the page number but keeps real metrics", () => {
        expect(removePageNumberLines("2\nContenido\n42", 2, 10)).toBe("Contenido\n42");
        expect(removePageNumberLines("2 / 10\nContenido", 2, 10)).toBe("Contenido");
    });
});

describe("stripRunningLines", () => {
    test("removes a header repeated on most pages", () => {
        const pages = ["Header\nUno", "Header\nDos", "Header\nTres", "Header\nCuatro"];

        expect(stripRunningLines(pages)).toEqual(["Uno", "Dos", "Tres", "Cuatro"]);
    });

    test("leaves short documents untouched", () => {
        const pages = ["Header\nUno", "Header\nDos", "Header\nTres"];

        expect(stripRunningLines(pages)).toEqual(pages);
    });
});

describe("applyRedactions", () => {
    test("replaces terms case-insensitively and reports missing ones", () => {
        const result = applyRedactions("Mail: WanderleeDev@gmail.com", ["wanderleedev@gmail.com", "telefono"]);

        expect(result.text).toBe("Mail: [redacted]");
        expect(result.missing).toEqual(["telefono"]);
    });
});

describe("buildSectionSources", () => {
    const manifest = corpusManifestSchema.parse({
        sections: [
            { id: "profile", title: "Perfil", section: "profile", pages: "1" },
            { id: "clior", title: "Clior", projectId: "clior", section: "summary", pages: "2-3" },
        ],
        redact: ["wanderleedev@gmail.com"],
    });

    test("maps pages, applies redactions and keeps project metadata", () => {
        const result = buildSectionSources(
            ["Uno wanderleedev@gmail.com", "Dos", "Tres"],
            manifest,
            3,
        );

        expect(result.sections).toHaveLength(2);
        expect(result.sections[0]?.text).toBe("Uno [redacted]");
        expect(result.sections[1]?.projectId).toBe("clior");
        expect(result.sections[1]?.pages).toEqual([2, 3]);
        expect(result.warnings).toEqual([]);
    });

    test("warns about overlapping and uncovered pages", () => {
        const overlapping = corpusManifestSchema.parse({
            sections: [
                { id: "uno", title: "Uno", pages: "1-2" },
                { id: "dos", title: "Dos", pages: "2-3" },
            ],
        });

        const result = buildSectionSources(["a", "b", "c", "d"], overlapping, 4);

        expect(result.warnings.some((warning) => warning.includes("claimed"))).toBe(true);
        expect(result.warnings.some((warning) => warning.includes("not covered"))).toBe(true);
    });
});

describe("corpusManifestSchema", () => {
    test("applies defaults", () => {
        const manifest = corpusManifestSchema.parse({
            sections: [{ id: "uno", title: "Uno", pages: "1" }],
        });

        expect(manifest.locale).toBe("es");
        expect(manifest.sections[0]?.section).toBe("other");
        expect(manifest.exclude).toEqual([]);
        expect(manifest.redact).toEqual([]);
    });

    test("rejects invalid slugs and page ranges", () => {
        expect(() =>
            corpusManifestSchema.parse({
                sections: [{ id: "Uno Uno", title: "Uno", pages: "1" }],
            }),
        ).toThrow();

        expect(() =>
            corpusManifestSchema.parse({
                sections: [{ id: "uno", title: "Uno", pages: "one" }],
            }),
        ).toThrow();
    });

    test("rejects duplicate section ids", () => {
        expect(() =>
            corpusManifestSchema.parse({
                sections: [
                    { id: "uno", title: "Uno", pages: "1" },
                    { id: "uno", title: "Otra", pages: "2" },
                ],
            }),
        ).toThrow();
    });
});
