import { z } from "zod";

const CORPUS_SECTIONS = [
    "profile",
    "summary",
    "challenge",
    "solution",
    "results",
    "stack",
    "other",
] as const;

export type CorpusSection = (typeof CORPUS_SECTIONS)[number];

const pageRange = z
    .string()
    .trim()
    .regex(/^\d+(-\d+)?$/, "use '12' or '3-7'");

export const corpusManifestSchema = z.object({
    locale: z.enum(["es", "en"]).default("es"),
    sections: z
        .array(
            z.object({
                id: z
                    .string()
                    .trim()
                    .regex(/^[a-z0-9][a-z0-9-]{0,63}$/, "use a lowercase slug"),
                title: z.string().trim().min(1).max(120),
                projectId: z.string().trim().min(1).max(64).optional(),
                section: z.enum(CORPUS_SECTIONS).default("other"),
                pages: pageRange,
            }),
        )
        .min(1),
    exclude: z.array(pageRange).default([]),
    redact: z.array(z.string().min(1).max(200)).default([]),
}).superRefine((manifest, ctx) => {
    const ids = new Set<string>();

    manifest.sections.forEach((section, index) => {
        if (ids.has(section.id)) {
            ctx.addIssue({
                code: "custom",
                message: `duplicate section id "${section.id}"`,
                path: ["sections", index, "id"],
            });
        }
        ids.add(section.id);
    });
});

export type CorpusManifest = z.infer<typeof corpusManifestSchema>;

export const corpusIndexSchema = z
    .object({
        version: z.literal(1),
        embedding: z.object({
            model: z.string().min(1).max(120),
            dimensions: z.number().int().positive().max(4096),
        }),
        chunking: z.object({
            maxChars: z.number().int().min(200),
            overlapChars: z.number().int().min(0),
        }),
        source: z.object({
            sha256: z.string().regex(/^[0-9a-f]{64}$/),
            manifestSha256: z
                .string()
                .regex(/^[0-9a-f]{64}$/)
                .nullable(),
            pages: z.number().int().positive(),
            locale: z.enum(["es", "en"]),
        }),
        chunks: z
            .array(
                z.object({
                    id: z.string().min(1),
                    projectId: z.string().min(1).optional(),
                    section: z.enum(CORPUS_SECTIONS),
                    title: z.string().min(1),
                    pages: z.array(z.number().int().positive()).min(1),
                    text: z.string().min(1),
                    vector: z.array(z.number()).min(1),
                }),
            )
            .min(1),
    })
    .superRefine((index, ctx) => {
        const ids = new Set<string>();

        index.chunks.forEach((chunk, position) => {
            if (ids.has(chunk.id)) {
                ctx.addIssue({
                    code: "custom",
                    message: `duplicate chunk id "${chunk.id}"`,
                    path: ["chunks", position, "id"],
                });
            }
            ids.add(chunk.id);

            if (chunk.vector.length !== index.embedding.dimensions) {
                ctx.addIssue({
                    code: "custom",
                    message: `expected ${index.embedding.dimensions} dimensions, got ${chunk.vector.length}`,
                    path: ["chunks", position, "vector"],
                });
            }
        });
    });

export type CorpusIndex = z.infer<typeof corpusIndexSchema>;

export interface CorpusChunkInput {
    id: string;
    projectId?: string;
    section: CorpusSection;
    title: string;
    pages: number[];
    text: string;
}

