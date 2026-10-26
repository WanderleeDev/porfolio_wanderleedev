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
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(280),
    technologies: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
    demo_url: optionalHttpUrl,
    image: optionalHttpUrl,
});

export const stackCategorySchema = z.object({
    title: z.string().trim().min(1).max(60),
    accent: optionalHex,
    techs: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
    alsoUsed: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
});

export const portfolioToolInputSchema = z
    .object({
        intro: toolIntroSchema.shape.intro,
        projects: z.array(projectCardSchema).min(1).max(4).optional(),
        stack: z.array(stackCategorySchema).min(1).max(5).optional(),
    })
    .refine((value) => Boolean(value.projects?.length || value.stack?.length), {
        message: "showPortfolio requires projects or stack",
    });

export type ProjectCard = z.infer<typeof projectCardSchema>;
export type StackCategoryCard = z.infer<typeof stackCategorySchema>;
export type PortfolioToolInput = z.infer<typeof portfolioToolInputSchema>;
