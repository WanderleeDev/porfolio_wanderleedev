import { describe, expect, test } from "bun:test";
import type { HybridHit } from "../../src/lib/rag/qdrant";
import { formatContext, selectChunks } from "../../src/lib/rag/retrieve";

function hit(
    chunkId: string,
    projectId: string | undefined,
    field: "summary" | "profile",
    score: number,
    title = projectId ?? "Profile",
): HybridHit {
    return {
        score,
        payload: {
            chunkId,
            ...(projectId ? { projectId } : {}),
            section: field,
            title,
            pages: [7, 8],
            text: `text of ${chunkId}`,
        },
    };
}

describe("selectChunks", () => {
    test("keeps fusion order and caps chunks per project", () => {
        const chunks = selectChunks(
            [
                hit("clior:1", "clior-ecommerce", "summary", 0.9),
                hit("clior:2", "clior-ecommerce", "summary", 0.8),
                hit("ngx:1", "ngx-theme-stack", "summary", 0.7),
                hit("clior:3", "clior-ecommerce", "summary", 0.6),
                hit("profile:1", undefined, "profile", 0.5),
            ],
            { limit: 8, maxPerProject: 2 },
        );

        expect(chunks.map((chunk) => chunk.id)).toEqual([
            "clior:1",
            "clior:2",
            "ngx:1",
            "profile:1",
        ]);
    });

    test("stops at the requested limit", () => {
        const chunks = selectChunks(
            [
                hit("a:1", "a", "summary", 0.9),
                hit("b:1", "b", "summary", 0.8),
                hit("c:1", "c", "summary", 0.7),
            ],
            { limit: 2 },
        );

        expect(chunks.map((chunk) => chunk.id)).toEqual(["a:1", "b:1"]);
    });

    test("groups projectless chunks by section", () => {
        const chunks = selectChunks(
            [
                hit("summary:1", undefined, "summary", 0.9),
                hit("summary:2", undefined, "summary", 0.8),
                hit("summary:3", undefined, "summary", 0.7),
                hit("profile:1", undefined, "profile", 0.6),
            ],
            { limit: 8, maxPerProject: 2 },
        );

        expect(chunks.map((chunk) => chunk.id)).toEqual(["summary:1", "summary:2", "profile:1"]);
    });

    test("skips payloads that do not match the stored contract", () => {
        const chunks = selectChunks(
            [
                { score: 0.9, payload: { chunkId: "broken" } },
                hit("ok:1", "ok", "summary", 0.8),
            ],
            { limit: 8 },
        );

        expect(chunks.map((chunk) => chunk.id)).toEqual(["ok:1"]);
    });
});

describe("formatContext", () => {
    test("labels each chunk with owner, section and pages", () => {
        const chunks = selectChunks(
            [hit("clior:1", "clior-ecommerce", "summary", 0.9, "Clior Ecommerce")],
            { limit: 1 },
        );
        const context = formatContext(chunks);

        expect(context).toContain("[1] clior-ecommerce · Clior Ecommerce · summary · p.7-8");
        expect(context).toContain("text of clior:1");
    });

    test("collapses a single page and omits a missing owner", () => {
        const chunks = selectChunks(
            [
                {
                    score: 0.5,
                    payload: {
                        chunkId: "profile:1",
                        section: "profile",
                        title: "Profile",
                        pages: [3],
                        text: "Fullstack developer.",
                    },
                },
            ],
            { limit: 1 },
        );

        expect(formatContext(chunks)).toBe(
            "[1] Profile · profile · p.3\nFullstack developer.",
        );
    });

    test("truncates long chunks to the requested budget", () => {
        const chunks = selectChunks(
            [
                {
                    score: 0.5,
                    payload: {
                        chunkId: "long:1",
                        section: "summary",
                        title: "Long",
                        pages: [1],
                        text: "x".repeat(2_000),
                    },
                },
            ],
            { limit: 1 },
        );
        const context = formatContext(chunks, { maxCharsPerChunk: 100 });

        expect(context.endsWith("…")).toBe(true);
        expect(context).toContain("x".repeat(100));
        expect(context).not.toContain("x".repeat(101));
    });

    test("returns an empty string without chunks", () => {
        expect(formatContext([])).toBe("");
    });
});
