import { getProjects, getStack, type Locale } from "./portfolio-data";

/**
 * The stack dictionaries store icon ids (`devicon:postgresql`), not reader-friendly
 * labels. A few entries carry an explicit name; the rest reduce their id to the name
 * segment, dropping packaging noise such as `file-type-`.
 */
function techLabel(tech: { icon: string; name?: string }): string {
    if (tech.name) return tech.name;
    const separator = tech.icon.indexOf(":");
    const name = separator === -1 ? tech.icon : tech.icon.slice(separator + 1);
    return name.replace(/^file-type-/, "").replace(/-/g, " ");
}

function stackLines(locale: Locale): string {
    return getStack(locale)
        .map((category) => {
            const main = category.techs.map(techLabel).join(", ");
            const extra = category.alsoUsed?.length
                ? ` | occasionally: ${category.alsoUsed.map(techLabel).join(", ")}`
                : "";
            return `- ${category.title} (accent ${category.accent}): ${main}${extra}`;
        })
        .join("\n");
}

/**
 * Stack-only projection. Used when the PROJECT CATALOG already carries the
 * projects: a second, shorter project list next to it only competes for the
 * model's attention.
 */
export function buildStackContext(locale: Locale): string {
    return `STACK DATA (copy labels and accents verbatim into the "stack" array):
${stackLines(locale)}`;
}

/**
 * Compact, deterministic projection of the portfolio for the model prompt.
 * Order comes straight from the dictionaries so the prefix stays stable and the
 * gateway prompt cache can be reused between requests.
 */
export function buildPortfolioContext(locale: Locale): string {
    const projects = getProjects(locale)
        .map((project) => {
            const stack = project.technologies.map((tech) => tech.toLowerCase()).join(", ");
            const description = project.description.replace(/\s+/g, " ").trim();
            return `- ${project.title}: ${description} | stack: ${stack} | demo: ${project.demo_url} | image: ${project.image}`;
        })
        .join("\n");

    return `## PORTFOLIO CONTEXT

Source of truth about the portfolio. Never invent projects, technologies or links: if
something is not listed here or in the PROJECT CATALOG, say you do not have that
information. Copy titles, descriptions, tech labels, URLs, image URLs and accents
verbatim; these are the only valid ones.

Featured projects (media and demo only; the full list is in the PROJECT CATALOG):
${projects}

Stack:
${stackLines(locale)}`;
}
