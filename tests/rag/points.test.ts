import { describe, expect, test } from "bun:test";
import { buildPoints, pointId } from "../../src/lib/rag/points";
import type { CorpusChunkInput } from "../../src/lib/rag/schema";

const sourceSha = "a".repeat(64);

const chunks: CorpusChunkInput[] = [
    {
        id: "clior-ecommerce:1",
        projectId: "clior-ecommerce",
        section: "summary",
        title: "Clior Ecommerce",
        pages: [7, 8],
        text: "Tienda online con Angular, NestJS y PostgreSQL.",
    },
    {
        id: "profile:1",
        section: "profile",
        title: "Profile",
        pages: [3],
        text: "Desarrollador fullstack en Lima, Perú.",
    },
];

const vectors = [
    [1, 0, 0],
    [0, 1, 0],
];

describe("pointId", () => {
    test("produces a deterministic UUID", () => {
        const first = pointId(sourceSha, "clior-ecommerce:1");
        expect(first).toBe(pointId(sourceSha, "clior-ecommerce:1"));
        expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    test("changes with the chunk and the source", () => {
        expect(pointId(sourceSha, "a:1")).not.toBe(pointId(sourceSha, "a:2"));
        expect(pointId(sourceSha, "a:1")).not.toBe(pointId("b".repeat(64), "a:1"));
    });
});

describe("buildPoints", () => {
    test("maps dense and sparse vectors with payload metadata", () => {
        const points = buildPoints(chunks, vectors, {
            sourceSha256: sourceSha,
            embeddingModel: "qwen3-embedding:0.6b",
            embeddingDimensions: 3,
        });

        expect(points).toHaveLength(2);

        const [project, profile] = points;
        expect(project?.vector.dense).toEqual([1, 0, 0]);
        expect(project?.vector.sparse.indices.length).toBeGreaterThan(0);
        expect(project?.payload).toMatchObject({
            chunkId: "clior-ecommerce:1",
            projectId: "clior-ecommerce",
            section: "summary",
            title: "Clior Ecommerce",
            pages: [7, 8],
            sourceSha256: sourceSha,
            embeddingModel: "qwen3-embedding:0.6b",
            embeddingDimensions: 3,
        });
        expect(project?.payload.projectId).toBe("clior-ecommerce");
        expect(profile?.payload.projectId).toBeUndefined();
    });

    test("rejects a vector count mismatch", () => {
        expect(() =>
            buildPoints(chunks, vectors.slice(0, 1), {
                sourceSha256: sourceSha,
                embeddingModel: "qwen3-embedding:0.6b",
                embeddingDimensions: 3,
            }),
        ).toThrow(/2 dense vectors/);
    });
});
