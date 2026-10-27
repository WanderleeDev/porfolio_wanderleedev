import { z } from "zod";

/**
 * Contrato de las cards que emite el LLM. El servidor no arma la data: sólo
 * valida forma y degrada URLs/colores inválidos para que una alucinación no
 * rompa la card ni renderice un `javascript:`.
 */
function isHttpUrl(value: string): boolean {
    try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
    } catch {
        return false;
    }
}

const MAX_TECH_LENGTH = 40;
const MAX_PROJECT_CARDS = 10;

const clampedText = (max: number) =>
    z.preprocess(
        (value) => (typeof value === "string" ? value.trim().slice(0, max) : ""),
        z.string().max(max),
    );

const techList = (maxItems: number) =>
    z.preprocess(
        (value) =>
            Array.isArray(value)
                ? value
                      .filter((item) => typeof item === "string" && item.trim().length > 0)
                      .slice(0, maxItems)
                      .map((item) => item.trim().slice(0, MAX_TECH_LENGTH))
                : [],
        z.array(z.string().min(1).max(MAX_TECH_LENGTH)).max(maxItems),
    );

const optionalHttpUrl = z
    .string()
    .max(600)
    .refine(isHttpUrl)
    .optional()
    .catch(undefined);

const optionalHex = z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .catch(undefined);

export const toolIntroSchema = z.object({
    intro: z.string().trim().min(1).max(180),
});

export const projectCardSchema = z.object({
    title: clampedText(80),
    description: clampedText(280),
    technologies: techList(10),
    demo_url: optionalHttpUrl,
    image: optionalHttpUrl,
});

export const stackCategorySchema = z.object({
    title: clampedText(60),
    accent: optionalHex,
    techs: techList(20),
    alsoUsed: techList(12).optional(),
});

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null;

const hasText = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const hasTechs = (value: unknown): boolean =>
    Array.isArray(value) && value.some(hasText);

const projectList = z.preprocess(
    (value) =>
        Array.isArray(value)
            ? value
                  .filter(
                      (item) =>
                          isRecord(item) && hasText(item.title) && hasText(item.description),
                  )
                  .slice(0, MAX_PROJECT_CARDS)
            : [],
    z.array(projectCardSchema).max(MAX_PROJECT_CARDS),
);

const stackList = z.preprocess(
    (value) =>
        Array.isArray(value)
            ? value
                  .filter(
                      (item) =>
                          isRecord(item) &&
                          hasText(item.title) &&
                          (hasTechs(item.techs) || hasTechs(item.alsoUsed)),
                  )
                  .slice(0, 5)
            : [],
    z.array(stackCategorySchema).max(5),
);

export const portfolioToolInputSchema = z.object({
    intro: clampedText(180),
    projects: projectList.optional(),
    stack: stackList.optional(),
});

export type ProjectCard = z.infer<typeof projectCardSchema>;
export type StackCategoryCard = z.infer<typeof stackCategorySchema>;
export type PortfolioToolInput = z.infer<typeof portfolioToolInputSchema>;
