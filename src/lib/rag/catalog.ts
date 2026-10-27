import type { QdrantClient } from "@qdrant/js-client-rest";
import { corpusPayloadSchema } from "./schema";

export interface ProjectCatalogEntry {
    projectId: string;
    title: string;
    pages: number[];
    summary: string;
}

export interface CatalogExtra {
    image?: string;
    demo_url?: string;
    technologies?: string[];
}

const MAX_SUMMARY_CHARS = 140;
const MAX_SCROLL_PAGES = 10;

export function trimSummary(text: string, maxChars = MAX_SUMMARY_CHARS): string {
    const collapsed = text.replace(/\s+/g, " ").trim();
    if (collapsed.length <= maxChars) return collapsed;

    const slice = collapsed.slice(0, maxChars);
    const stop = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("; "),
        slice.lastIndexOf(", "),
    );
    const cut = stop >= Math.floor(maxChars * 0.6) ? slice.slice(0, stop + 1) : slice;

    return `${cut.trimEnd()}…`;
}

/**
 * One entry per project, using its first summary chunk (lowest page) so the
 * catalog reads like the PDF summary instead of a random fragment.
 */
export function selectCatalogEntries(
    points: { payload?: unknown }[],
): ProjectCatalogEntry[] {
    const firstByProject = new Map<string, { pages: number[]; title: string; text: string }>();

    for (const point of points) {
        const parsed = corpusPayloadSchema.safeParse(point.payload);
        if (!parsed.success) continue;
        const payload = parsed.data;
        if (payload.section !== "summary" || !payload.projectId) continue;

        const current = firstByProject.get(payload.projectId);
        const page = payload.pages[0] ?? Number.MAX_SAFE_INTEGER;
        const currentPage = current?.pages[0] ?? Number.MAX_SAFE_INTEGER;
        if (!current || page < currentPage) {
            firstByProject.set(payload.projectId, {
                pages: payload.pages,
                title: payload.title,
                text: payload.text,
            });
        }
    }

    return [...firstByProject.entries()]
        .sort(([leftId, left], [rightId, right]) => {
            const byPage = (left.pages[0] ?? 0) - (right.pages[0] ?? 0);
            return byPage !== 0 ? byPage : leftId.localeCompare(rightId);
        })
        .map(([projectId, entry]) => ({
            projectId,
            title: entry.title,
            pages: entry.pages,
            summary: trimSummary(entry.text),
        }));
}

export async function loadProjectCatalog(
    client: QdrantClient,
    collection: string,
): Promise<ProjectCatalogEntry[]> {
    const points: { payload?: unknown }[] = [];
    let offset: string | number | undefined;

    for (let page = 0; page < MAX_SCROLL_PAGES; page += 1) {
        const result = await client.scroll(collection, {
            limit: 128,
            offset,
            with_payload: true,
            with_vector: false,
            filter: { must: [{ key: "section", match: { value: "summary" } }] },
        });

        points.push(...result.points);
        const next = result.next_page_offset;
        offset = typeof next === "string" || typeof next === "number" ? next : undefined;
        if (!offset) break;
    }

    return selectCatalogEntries(points);
}

export function formatProjectCatalog(
    entries: ProjectCatalogEntry[],
    extras: Map<string, CatalogExtra> = new Map(),
): string {
    return entries
        .map((entry) => {
            const fields = [`title: ${entry.title}`, `summary: ${entry.summary}`];
            const extra = extras.get(entry.projectId);
            if (extra?.technologies?.length) fields.push(`techs: ${extra.technologies.join(", ")}`);
            if (extra?.image) fields.push(`image: ${extra.image}`);
            if (extra?.demo_url) fields.push(`demo: ${extra.demo_url}`);
            return `- ${fields.join(" | ")}`;
        })
        .join("\n");
}
