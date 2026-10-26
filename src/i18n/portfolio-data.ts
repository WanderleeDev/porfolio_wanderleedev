import { es } from "./locales/es";
import { en } from "./locales/en";

const dictionaries = { es, en } as const;

export type Locale = keyof typeof dictionaries;

export type PortfolioTech = (typeof es.skills.list)[number]["techs"][number];
export type PortfolioStackCategory = (typeof es.skills.list)[number];
export type PortfolioProject = (typeof es.projects.list)[number];

export function resolveLocale(raw: string | null | undefined): Locale {
    return raw === "en" ? "en" : "es";
}

export function getProjects(locale: Locale): PortfolioProject[] {
    return dictionaries[locale].projects.list;
}

export function getStack(locale: Locale): PortfolioStackCategory[] {
    return dictionaries[locale].skills.list;
}

const TECH_NAMES: Record<string, string> = {
    postgresql: "PostgreSQL",
    nestjs: "NestJS",
    nodejs: "Node.js",
    html5: "HTML5",
    css3: "CSS3",
    javascript: "JavaScript",
    typescript: "TypeScript",
    nextjs: "Next.js",
    vuejs: "Vue.js",
    tailwindcss: "TailwindCSS",
    ngrx: "NgRx",
    greensock: "GSAP",
    fastapi: "FastAPI",
    github: "GitHub",
    vscode: "VS Code",
    intellij: "IntelliJ IDEA",
    visualstudiocode: "VS Code",
    springboot: "Spring Boot",
    mongodb: "MongoDB",
    prisma: "Prisma",
    figma: "Figma",
    postman: "Postman",
    slack: "Slack",
    jest: "Jest",
    cypress: "Cypress",
    docker: "Docker",
    trello: "Trello",
    java: "Java",
    python: "Python",
    ruby: "Ruby",
    rails: "Ruby on Rails",
    react: "React",
    angular: "Angular",
    astro: "Astro",
    sass: "Sass",
    vue: "Vue",
    git: "Git",
};

export function techLabel(icon: string, name?: string): string {
    if (name) return name;
    const raw = icon.split(":").pop() ?? icon;
    const key = raw.toLowerCase();
    if (TECH_NAMES[key]) return TECH_NAMES[key];
    const base = raw.replace(/[-_]/g, " ").trim();
    return base.charAt(0).toUpperCase() + base.slice(1);
}
