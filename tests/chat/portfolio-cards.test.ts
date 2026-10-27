import { describe, expect, test } from "bun:test";
import { portfolioToolInputSchema } from "../../src/i18n/portfolio-cards";

function project(index: number) {
    return {
        title: `Project ${index}`,
        description: `Description ${index}`,
        technologies: ["typescript"],
    };
}

describe("portfolioToolInputSchema projects", () => {
    test("accepts the ten projects from the corpus catalog", () => {
        const parsed = portfolioToolInputSchema.safeParse({
            intro: "Estos son mis proyectos.",
            projects: Array.from({ length: 10 }, (_, index) => project(index)),
        });

        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.projects).toHaveLength(10);
    });

    test("caps the list at ten projects", () => {
        const parsed = portfolioToolInputSchema.safeParse({
            intro: "Proyectos.",
            projects: Array.from({ length: 11 }, (_, index) => project(index)),
        });

        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.projects).toHaveLength(10);
    });

    test("lets a project omit technologies and media", () => {
        const parsed = portfolioToolInputSchema.safeParse({
            intro: "Un proyecto.",
            projects: [{ title: "Pixel Pet", description: "Componente Lit." }],
        });

        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.projects?.[0]?.technologies).toEqual([]);
    });
});
