import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { PROJECT_CATALOG, TECH_CATALOG } from "../../src/ai/catalog";
import { ProjectListSchema, TechListSchema } from "../../src/ai/ui-schema";

const manifest = JSON.parse(readFileSync("data/corpus/manifest.json", "utf8")) as {
    sections: { projectId?: string }[];
};

describe("PROJECT_CATALOG", () => {
    test("covers every project in the corpus manifest, in order", () => {
        const manifestIds = manifest.sections
            .map((section) => section.projectId)
            .filter((id): id is string => Boolean(id));

        expect(PROJECT_CATALOG.map((entry) => entry.projectId)).toEqual(manifestIds);
    });

    test("has unique names and valid links", () => {
        const names = PROJECT_CATALOG.map((entry) => entry.nombre);
        expect(new Set(names).size).toBe(names.length);

        for (const entry of PROJECT_CATALOG) {
            expect(entry.descripcion.length).toBeGreaterThan(20);
            const url = entry.url;
            if (url) expect(() => new URL(url)).not.toThrow();
        }
    });

    test("renders as a valid project list without extra fields", () => {
        const cards = PROJECT_CATALOG.map(({ nombre, descripcion, url }) => ({
            nombre,
            descripcion,
            ...(url ? { url } : {}),
        }));

        const parsed = ProjectListSchema.parse({ titulo: "Proyectos", proyectos: cards });
        expect(parsed.proyectos).toHaveLength(PROJECT_CATALOG.length);
        expect(parsed.proyectos[0]).not.toHaveProperty("projectId");
    });
});

describe("TECH_CATALOG", () => {
    test("fits the card limit with unique names and absolute URLs", () => {
        expect(TECH_CATALOG.length).toBeGreaterThanOrEqual(8);
        expect(TECH_CATALOG.length).toBeLessThanOrEqual(10);

        const names = TECH_CATALOG.map((entry) => entry.nombre);
        expect(new Set(names).size).toBe(names.length);

        for (const entry of TECH_CATALOG) {
            const url = new URL(entry.url);
            expect(url.protocol).toBe("https:");
            expect(entry.descripcion.length).toBeGreaterThan(10);
        }
    });

    test("renders as a valid tech list", () => {
        const parsed = TechListSchema.parse({ titulo: "Tecnologías", techs: TECH_CATALOG });
        expect(parsed.techs).toHaveLength(TECH_CATALOG.length);
    });
});
