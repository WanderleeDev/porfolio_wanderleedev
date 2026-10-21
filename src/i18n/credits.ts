import { es } from "./locales/es";
import { en } from "./locales/en";
import { techLabel } from "./portfolio-data";

const dictionaries = { es, en } as const;

export type CreditsLocale = keyof typeof dictionaries;

export interface CreditsLink {
    label: string;
    href: string;
}

export interface CreditsLine {
    text: string;
    variant: "heading" | "detail";
}

export interface CreditsBlock {
    id: string;
    label: string;
    title?: string;
    lines?: CreditsLine[];
    links?: CreditsLink[];
}

export interface CreditsContent {
    blocks: CreditsBlock[];
    closing: string;
}

function categoryLines(
    category: {
        techs: { icon: string; name?: string }[];
        alsoUsed?: { icon: string; name?: string }[];
    },
    alsoUsedLabel: string,
): CreditsLine[] {
    const main = category.techs.map((tech) => techLabel(tech.icon, tech.name)).join("  ·  ");
    const also = (category.alsoUsed ?? []).map((tech) => techLabel(tech.icon, tech.name)).join("  ·  ");
    const lines: CreditsLine[] = [{ text: main, variant: "detail" }];
    if (also) lines.push({ text: `${alsoUsedLabel}: ${also}`, variant: "detail" });
    return lines;
}

export function getCredits(locale: CreditsLocale): CreditsContent {
    const t = dictionaries[locale];
    const credits = t.credits;
    const footer = t.footer;

    const blocks: CreditsBlock[] = [
        {
            id: "role",
            label: credits.roles.role,
            title: t.hero.titleSecond,
        },
        {
            id: "stack",
            label: credits.roles.stack,
            lines: t.skills.list.flatMap((category) => [
                { text: category.title, variant: "heading" as const },
                ...categoryLines(category, t.skills.alsoUsedLabel),
            ]),
        },
        {
            id: "projects",
            label: credits.roles.projects,
            lines: t.projects.list.flatMap((project) => [
                { text: project.title, variant: "heading" as const },
                { text: project.description, variant: "detail" as const },
            ]),
        },
        {
            id: "contact",
            label: credits.roles.contact,
            links: [
                { label: footer.email, href: `mailto:${footer.email}` },
                { label: "github.com/WanderleeDev", href: "https://github.com/WanderleeDev" },
                {
                    label: "linkedin.com/in/wanderlee-max",
                    href: "https://linkedin.com/in/wanderlee-max",
                },
            ],
        },
    ];

    return { blocks, closing: credits.closing };
}
