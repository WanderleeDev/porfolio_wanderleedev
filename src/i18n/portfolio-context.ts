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
            return `- ${project.title}: ${description} | stack: ${stack} | demo: ${project.demo_url}`;
        })
        .join("\n");

    const stack = getStack(locale)
        .map((category) => `- ${category.title}: ${category.techs.map(techLabel).join(", ")}`)
        .join("\n");

    return `## PORTFOLIO CONTEXT

Source of truth about the portfolio. Never invent projects, technologies or links: if
something is not listed here, say you do not have that information.

Projects:
${projects}

Stack:
${stack}`;
}
