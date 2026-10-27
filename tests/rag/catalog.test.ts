import { describe, expect, test } from "bun:test";
import {
    formatProjectCatalog,
    selectCatalogEntries,
    trimSummary,
} from "../../src/lib/rag/catalog";

function point(
    projectId: string,
    chunkId: string,
    pages: number[],
    text: string,
    section: string = "summary",
) {
    return {
        payload: {
            chunkId,
            ...(section === "summary" ? { projectId } : {}),
            section,
            title: projectId,
            pages,
            text,
        },
    };
}

describe("selectCatalogEntries", () => {
    test("keeps one entry per project using its first page chunk", () => {
        const entries = selectCatalogEntries([
            point("clior-ecommerce", "clior:2", [9], "second chunk"),
            point("clior-ecommerce", "clior:1", [7], "first chunk"),
            point("ngx-theme-stack", "ngx:1", [15], "theme summary"),
            point("profile", "profile:1", [3], "profile text", "profile"),
        ]);

        expect(entries.map((entry) => entry.projectId)).toEqual([
            "clior-ecommerce",
            "ngx-theme-stack",
        ]);
        expect(entries[0]?.summary).toBe("first chunk");
    });

    test("ignores malformed payloads and projects without an id", () => {
        const entries = selectCatalogEntries([
            { payload: { chunkId: "broken" } },
            { payload: undefined },
            point("llm-gateway", "gw:1", [24], "gateway summary"),
        ]);

        expect(entries.map((entry) => entry.projectId)).toEqual(["llm-gateway"]);
    });
});

describe("trimSummary", () => {
    test("cuts at a sentence boundary when one is near the limit", () => {
        const text = `${"a".repeat(120)}. ${"b".repeat(120)}. ${"c".repeat(120)}`;
        expect(trimSummary(text, 300)).toBe(`${"a".repeat(120)}. ${"b".repeat(120)}.…`);
    });

    test("defaults to 140 chars so the catalog stays cheap to copy", () => {
        const text = `${"a".repeat(120)}. ${"b".repeat(120)}.`;
        expect(trimSummary(text)).toBe(`${"a".repeat(120)}.…`);
    });

    test("leaves short text untouched", () => {
        expect(trimSummary("short summary", 200)).toBe("short summary");
    });
});

describe("formatProjectCatalog", () => {
    test("adds media and techs only when the project has them", () => {
        const entries = selectCatalogEntries([
            point("clior-ecommerce", "clior:1", [7], "commerce summary"),
            point("llm-gateway", "gw:1", [24], "gateway summary"),
        ]);
        const extras = new Map([
            [
                "clior-ecommerce",
                {
                    image: "https://img.test/clior.webp",
                    demo_url: "https://demo.test",
                    technologies: ["Angular", "Sass"],
                },
            ],
        ]);

        const formatted = formatProjectCatalog(entries, extras);

        expect(formatted).toContain("title: clior-ecommerce");
        expect(formatted).toContain("techs: Angular, Sass");
        expect(formatted).toContain("image: https://img.test/clior.webp");
        expect(formatted).toContain("demo: https://demo.test");
        expect(formatted.split("\n")).toHaveLength(2);
        expect(formatted.split("\n")[1]).not.toContain("image:");
        expect(formatted.split("\n")[1]).not.toContain("techs:");
    });
});
