import { es } from "./locales/es";
import { en } from "./locales/en";

const dictionaries = { es, en } as const;

export type Locale = keyof typeof dictionaries;

export type PortfolioTech = (typeof es.skills.list)[number]["techs"][number];
export type PortfolioStackCategory = (typeof es.skills.list)[number];
export type PortfolioProject = (typeof es.projects.list)[number];

export type ProjectsToolOutput = { projects: PortfolioProject[] };
export type StackToolOutput = { categories: PortfolioStackCategory[] };

export function resolveLocale(raw: string | null | undefined): Locale {
    return raw === "en" ? "en" : "es";
}

export function getProjects(locale: Locale): PortfolioProject[] {
    return dictionaries[locale].projects.list;
}

export function getStack(locale: Locale): PortfolioStackCategory[] {
    return dictionaries[locale].skills.list;
}

function matches(haystack: string, needle: string | undefined): boolean {
    if (!needle) return true;
    const bag = haystack.toLowerCase();
    return bag.includes(needle.toLowerCase());
}

export function filterProjects(
    locale: Locale,
    focus: string | undefined,
): PortfolioProject[] {
    const needle = focus?.trim();
    if (!needle) return getProjects(locale);
    return getProjects(locale).filter((p) =>
        matches(`${p.title} ${p.description} ${p.technologies.join(" ")}`, needle),
    );
}

export function filterStack(
    locale: Locale,
    category: string | undefined,
): PortfolioStackCategory[] {
    const needle = category?.trim();
    if (!needle) return getStack(locale);
    return getStack(locale).filter((c) => matches(c.title, needle));
}
