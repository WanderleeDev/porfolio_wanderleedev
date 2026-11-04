import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import {
    corpusManifestSchema,
    type CorpusChunkInput,
    type CorpusManifest,
} from "./schema";
import {
    buildSectionSources,
    chunkText,
    estimateTokens,
    normalizeText,
    removePageNumberLines,
    stripRunningLines,
    type SectionSource,
} from "./text";

export const DEFAULT_MANIFEST = "data/corpus/manifest.json";
export const DEFAULT_MAX_CHARS = 1800;
export const DEFAULT_OVERLAP_CHARS = 240;

interface CorpusLoadOptions {
    pdf: string;
    /** Explicit manifest path; pass null to skip it and use the whole-document fallback. */
    manifest?: string | null;
    maxChars?: number;
    overlapChars?: number;
    keepRunningLines?: boolean;
}

interface LoadedCorpus {
    chunks: CorpusChunkInput[];
    sections: SectionSource[];
    /** Cleaned page text, useful for reviewing the manifest mapping. */
    pages: string[];
    totalPages: number;
    pdfSha256: string;
    manifestSha256: string | null;
    manifest: CorpusManifest;
    totalChars: number;
    totalTokens: number;
    pdfBytes: number;
    warnings: string[];
}

function sha256(value: string | Uint8Array): string {
    return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;

    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        return `{${Object.keys(record)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
            .join(",")}}`;
    }

    return JSON.stringify(value);
}

/**
 * Hashing the parsed manifest instead of the raw bytes means reformatting the
 * JSON (indentation, key order) does not mark the index stale.
 */
function manifestSha256(manifest: CorpusManifest): string {
    return sha256(canonicalJson(manifest));
}

export function resolveManifestPath(explicit?: string | null): string | null {
    if (explicit === null) return null;
    if (explicit) return explicit;
    return existsSync(DEFAULT_MANIFEST) ? DEFAULT_MANIFEST : null;
}

function fallbackManifest(totalPages: number): CorpusManifest {
    return {
        locale: "es",
        sections: [
            {
                id: "corpus",
                title: "Corpus",
                section: "other",
                pages: `1-${totalPages}`,
            },
        ],
        exclude: [],
        redact: [],
    };
}

async function readManifest(path: string): Promise<CorpusManifest> {
    const raw = await readFile(path, "utf8");
    return corpusManifestSchema.parse(JSON.parse(raw));
}

export async function loadCorpus(options: CorpusLoadOptions): Promise<LoadedCorpus> {
    const pdfPath = resolve(options.pdf);
    let pdfBuffer: Buffer;

    try {
        pdfBuffer = await readFile(pdfPath);
    } catch {
        throw new Error(`cannot read PDF at ${pdfPath}`);
    }

    const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
    const extracted = await extractText(pdf, { mergePages: false });
    const totalPages = extracted.totalPages;
    const rawPages = extracted.text.map(normalizeText);

    const emptyPages = rawPages.filter((page) => page.length < 20).length;
    if (emptyPages >= totalPages * 0.6) {
        throw new Error("the PDF has no extractable text (scanned?); run OCR before ingesting it");
    }

    const pages = options.keepRunningLines
        ? rawPages
        : stripRunningLines(
              rawPages.map((page, index) => removePageNumberLines(page, index + 1, totalPages)),
          );

    const manifestPath = resolveManifestPath(options.manifest);
    const manifest = manifestPath
        ? await readManifest(manifestPath)
        : fallbackManifest(totalPages);

    const { sections, warnings } = buildSectionSources(pages, manifest, totalPages);
    if (!sections.length) throw new Error("the manifest produced no sections");

    const chunks = sections.flatMap((section) =>
        chunkText(section.text, {
            maxChars: options.maxChars,
            overlapChars: options.overlapChars,
        }).map((text, index) => ({
            id: `${section.id}:${index + 1}`,
            ...(section.projectId ? { projectId: section.projectId } : {}),
            section: section.section,
            title: section.title,
            pages: section.pages,
            text,
        })),
    );

    if (!chunks.length) throw new Error("no chunks were produced");

    return {
        chunks,
        sections,
        pages,
        totalPages,
        pdfSha256: sha256(pdfBuffer),
        manifestSha256: manifestPath ? manifestSha256(manifest) : null,
        manifest,
        totalChars: chunks.reduce((sum, chunk) => sum + chunk.text.length, 0),
        totalTokens: chunks.reduce((sum, chunk) => sum + estimateTokens(chunk.text), 0),
        pdfBytes: pdfBuffer.length,
        warnings,
    };
}
