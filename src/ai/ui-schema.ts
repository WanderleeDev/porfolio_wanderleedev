import z from "zod";

export const ProjectItem = z.object({
    nombre: z.string(),
    descripcion: z.string(),
    url: z.string(),
});

export const ProjectListSchema = z.object({
    titulo: z.string().describe("Section heading for the project list, in Spanish"),
    proyectos: z
        .array(ProjectItem)
        .max(6)
        .describe("Up to 6 projects to display as cards"),
});

export const TechListSchema = z.object({
    titulo: z.string().describe("Section heading for the tech list, in Spanish"),
    techs: z
        .array(
            z.object({
                nombre: z.string().describe("Technology name (e.g. TypeScript, Qdrant)"),
                descripcion: z.string().describe("One-sentence summary of how the technology is used"),
                url: z.url().describe("Official website or repository URL for the technology"),
            }),
        )
        .max(6)
        .describe("Up to 6 technologies to display as cards"),
});

export const ContacSchema = z.object({
    name: z.string().describe("Full name of the person"),
    email: z.string().describe("Contact email address"),
    linkedin: z.string().describe("LinkedIn profile URL"),
    github: z.string().describe("GitHub profile URL"),
})

export type ProjectListProps = z.infer<typeof ProjectListSchema>;
export type TechListProps = z.infer<typeof TechListSchema>;
export type ContactProps = z.infer<typeof ContacSchema>;
