import type { CorpusManifest, CorpusSection } from "./schema";

const MIN_CHUNK_CHARS = 40;
const MIN_OVERLAP_CHARS = 80;

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Extracted PDF text carries soft hyphens, broken line wraps and stray spaces.
 * Rejoining a word broken at the end of a line only when the next line starts
 * lowercase avoids eating real hyphens such as "NestJS-based".
 */
export function normalizeText(input: string): string {
    return input
        .normalize("NFC")
        .replace(/\r\n?/g, "\n")
        .replace(/\u00ad/g, "")
        .replace(/\uFB01/g, "fi")
        .replace(/\uFB02/g, "fl")
        .replace(/(\p{L})-\n(\p{Ll})/gu, "$1$2")
        .replace(/[ \t]+/g, " ")
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Running headers and footers repeat on almost every page and only add noise to
 * the index. A line must appear on at least half the pages to be dropped.
 */
export function stripRunningLines(pages: string[]): string[] {
    if (pages.length < 4) return pages;

    const counts = new Map<string, number>();

    for (const page of pages) {
        const seen = new Set<string>();

        for (const line of page.split("\n")) {
            const key = line.trim();
            if (!key || key.length > 100 || seen.has(key)) continue;
            seen.add(key);
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
    }

    const threshold = Math.max(3, Math.ceil(pages.length * 0.5));
    const running = new Set(
        [...counts.entries()]
            .filter(([line, count]) => count >= threshold && line.length <= 100)
            .map(([line]) => line),
    );

    if (!running.size) return pages;

    return pages.map((page) =>
        page
            .split("\n")
            .filter((line) => !running.has(line.trim()))
            .join("\n"),
    );
}

/**
 * Removes a standalone page number only when it matches this page's position
 * (or the page count), so real metrics such as "42" inside the body survive.
 */
export function removePageNumberLines(page: string, pageNumber: number, totalPages: number): string {
    return page
        .split("\n")
        .filter((line) => {
            const value = line.trim();
            if (/^\d{1,4}$/.test(value)) {
                const number = Number(value);
                return number !== pageNumber && number !== totalPages;
            }

            const fraction = /^(\d{1,4})\s*\/\s*(\d{1,4})$/.exec(value);
            if (fraction) {
                return !(Number(fraction[1]) === pageNumber && Number(fraction[2]) === totalPages);
            }

            return true;
        })
        .join("\n");
}

interface ChunkOptions {
    maxChars?: number;
    overlapChars?: number;
    minChars?: number;
}

/**
 * Paragraph-aware chunking with a sentence-level fallback. `maxChars` is a hard
 * cap that already includes the overlap carried from the previous chunk.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
    const maxChars = options.maxChars ?? 1800;
    const overlapChars = options.overlapChars ?? 240;
    const minChars = options.minChars ?? MIN_CHUNK_CHARS;

    if (!Number.isFinite(maxChars) || maxChars < 200) {
        throw new Error("maxChars must be a finite number of at least 200");
    }
    if (!Number.isFinite(overlapChars) || overlapChars < 0 || overlapChars >= maxChars / 2) {
        throw new Error("overlapChars must be >= 0 and less than half of maxChars");
    }

    const units = splitUnits(normalizeText(text), maxChars);
    const chunks: string[] = [];
    let current = "";

    for (const unit of units) {
        if (current && current.length + 2 + unit.length > maxChars) {
            chunks.push(current.trim());
            current = overlapFrom(current, overlapChars);

            if (current && current.length + 2 + unit.length > maxChars) current = "";
        }

        current = current ? `${current}\n\n${unit}` : unit;
    }

    const tail = current.trim();
    if (tail) {
        if (tail.length >= minChars || chunks.length === 0) chunks.push(tail);
    }

    return chunks;
}

function splitUnits(text: string, maxChars: number): string[] {
    const units: string[] = [];

    for (const paragraph of text.split(/\n{2,}/)) {
        const value = paragraph.trim();
        if (!value) continue;

        if (value.length <= maxChars) {
            units.push(value);
            continue;
        }

        let current = "";

        for (const sentence of value.split(/(?<=[.!?…])\s+/)) {
            if (sentence.length > maxChars) {
                if (current) {
                    units.push(current);
                    current = "";
                }

                for (let offset = 0; offset < sentence.length; offset += maxChars) {
                    units.push(sentence.slice(offset, offset + maxChars));
                }
                continue;
            }

            if (current && current.length + 1 + sentence.length > maxChars) {
                units.push(current);
                current = "";
            }

            current = current ? `${current} ${sentence}` : sentence;
        }

        if (current) units.push(current);
    }

    return units;
}

function overlapFrom(text: string, overlapChars: number): string {
    if (overlapChars < MIN_OVERLAP_CHARS || !text) return "";

    let tail = text.slice(-overlapChars);
    const space = tail.indexOf(" ");
    if (space !== -1) tail = tail.slice(space + 1);

    tail = tail.trim();
    return tail.length >= MIN_OVERLAP_CHARS ? tail : "";
}

export function parsePageRange(value: string, totalPages: number): number[] {
    const match = /^(\d+)(?:-(\d+))?$/.exec(value.trim());

    if (!match) throw new Error(`Invalid page range "${value}"`);

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > totalPages) {
        throw new Error(`Page range "${value}" is outside the document (1-${totalPages})`);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function applyRedactions(
    text: string,
    terms: string[],
): { text: string; missing: string[] } {
    let result = text;
    const missing: string[] = [];

    for (const term of terms) {
        if (!result.toLowerCase().includes(term.toLowerCase())) {
            missing.push(term);
            continue;
        }

        result = result.replace(new RegExp(escapeRegExp(term), "gi"), "[redacted]");
    }

    return { text: result, missing };
}

export interface SectionSource {
    id: string;
    title: string;
    projectId?: string;
    section: CorpusSection;
    pages: number[];
    text: string;
}

interface SectionBuildResult {
    sections: SectionSource[];
    warnings: string[];
}

export function buildSectionSources(
    pages: string[],
    manifest: CorpusManifest,
    totalPages: number,
): SectionBuildResult {
    const excluded = new Set(manifest.exclude.flatMap((range) => parsePageRange(range, totalPages)));
    const claimed = new Map<number, string>();
    const warnings: string[] = [];
    const sections: SectionSource[] = [];

    const redactedTerms = new Set<string>();

    const redactedPages = pages.map((page) => {
        const { text, missing } = applyRedactions(page, manifest.redact);
        for (const term of manifest.redact) {
            if (!missing.includes(term)) redactedTerms.add(term);
        }
        return text;
    });

    for (const term of manifest.redact) {
        if (!redactedTerms.has(term)) warnings.push(`redaction "${term}" was not found in the corpus`);
    }

    for (const section of manifest.sections) {
        const selected = parsePageRange(section.pages, totalPages).filter((page) => {
            if (excluded.has(page)) return false;

            const owner = claimed.get(page);
            if (owner) {
                warnings.push(`page ${page} is claimed by "${owner}" and "${section.id}"`);
                return false;
            }

            claimed.set(page, section.id);
            return true;
        });

        if (!selected.length) {
            warnings.push(`section "${section.id}" has no pages`);
            continue;
        }

        const text = normalizeText(selected.map((page) => redactedPages[page - 1] ?? "").join("\n\n"));

        if (!text) {
            warnings.push(`section "${section.id}" has no text`);
            continue;
        }

        sections.push({
            id: section.id,
            title: section.title,
            ...(section.projectId ? { projectId: section.projectId } : {}),
            section: section.section,
            pages: selected,
            text,
        });
    }

    const uncovered: number[] = [];
    for (let page = 1; page <= totalPages; page += 1) {
        if (!claimed.has(page) && !excluded.has(page)) uncovered.push(page);
    }

    if (uncovered.length) {
        warnings.push(`pages not covered by any section: ${uncovered.join(", ")}`);
    }

    return { sections, warnings };
}
