import z from "zod";

export const BodySchema = z.object({
    messages: z
        .array(
            z.object({
                id: z.string(),
                role: z.enum(['user', 'assistant', 'system']),
                parts: z.array(z.any()),
            }),
        )
        .min(1)
        .max(50),
});

export const ProjectItem = z.object({
    nombre: z.string(),
    descripcion: z.string(),
    url: z.url().optional().describe("Live demo or public repository, when one exists"),
});

export const ProjectListSchema = z.object({
    titulo: z.string().describe("Section heading for the project list, in Spanish"),
    proyectos: z
        .array(ProjectItem)
        .max(12)
        .describe("Projects to display as cards"),
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
        .max(10)
        .describe("Technologies to display as cards"),
});

export const ContacSchema = z.object({
    name: z.string().describe("Full name of the person"),
    email: z.string().describe("Contact email address"),
    linkedin: z.string().describe("LinkedIn profile URL"),
    github: z.string().describe("GitHub profile URL"),
})

export const TrackListSchema = z.object({
    titulo: z.string().describe("Section heading for the track list, in Spanish"),
    tracks: z
        .array(
            z.object({
                titulo: z.string().describe("Track title (e.g. Between Us)"),
                artista: z.string().describe("Composer or performer of the track"),
            }),
        )
        .max(12)
        .describe("Tracks available in the portfolio player"),
});

export const PlaybackSchema = z.object({
    titulo: z.string().describe("Title of the track that owns the player now"),
    artista: z.string().describe("Composer or performer of that track"),
    playing: z.boolean().describe("Whether audio is actually playing after the command"),
    mensaje: z.string().describe("One short sentence for the user, in the user's language"),
});

export type ProjectListProps = z.infer<typeof ProjectListSchema>;
export type TechListProps = z.infer<typeof TechListSchema>;
export type ContactProps = z.infer<typeof ContacSchema>;
export type TrackListProps = z.infer<typeof TrackListSchema>;
export type PlaybackProps = z.infer<typeof PlaybackSchema>;
