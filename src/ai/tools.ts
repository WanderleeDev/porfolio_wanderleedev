import { tool, embed } from 'ai';
import { z } from 'zod';
import { ProjectListSchema, TechListSchema, ContacSchema, TrackListSchema, PlaybackSchema } from './ui-schema';
import { PROJECT_CATALOG, TECH_CATALOG } from './catalog';
import { TRACKS } from '../components/music-player/tracks';
import { embeddingModel } from '../lib/llm';
import { searchCorpus } from '../lib/rag/vectorize';

const PROJECT_CARDS = PROJECT_CATALOG.map(({ nombre, descripcion, url }) => ({
  nombre,
  descripcion,
  ...(url ? { url } : {}),
}));

export const displayProjects = tool({
  description:
    'Show the portfolio projects as a card list. Use when the user asks to see, list, or browse the projects, portfolio, or work samples (e.g. "show me your projects", "what have you built?", "muéstrame tus proyectos"). Do not use for questions about one specific project\'s details, technologies, or history; use searchKnowledgeBase for those. The projects are rendered in a card, so do not repeat the list in text.',
  inputSchema: z.object({}),
  outputSchema: ProjectListSchema,
  toModelOutput: ({ output }) => ({
    type: 'text',
    value: `Mostrados ${output.proyectos.length} proyectos en una tarjeta.`,
  }),
  execute: async () => ({
    titulo: 'Proyectos',
    proyectos: PROJECT_CARDS,
  }),
});

export const displayTechs = tool({
  description:
    'Show the technologies and tools used across the projects as a card. Use when the user asks which technologies, languages, frameworks, or tools the author works with or uses (e.g. "what stack do you use?", "what technologies do you know?", "qué tecnologías usas?"). Do not use for questions about how a specific technology was applied in a project; use searchKnowledgeBase for those. The list is rendered in a card, so do not repeat it in text.',
  inputSchema: z.object({}),
  outputSchema: TechListSchema,
  toModelOutput: ({ output }) => ({
    type: 'text',
    value: `Mostradas ${output.techs.length} tecnologías en una tarjeta.`,
  }),
  execute: async () => ({
    titulo: 'Tecnologías',
    techs: TECH_CATALOG,
  }),
});

export const displayContact = tool({
  description:
    'Show the author\'s contact information (email, LinkedIn, GitHub) as a card. Use when the user wants to get in touch, hire, collaborate, or asks how to contact or find the author (e.g. "how can I contact you?", "do you have a LinkedIn?", "cómo te contacto?"). Do not use for general questions about the author\'s background or experience; use searchKnowledgeBase for those.',
  inputSchema: z.object({}),
  outputSchema: ContacSchema,
  toModelOutput: ({ output }) => ({
    type: 'text',
    value: `Mostrados los datos de contacto de ${output.name}.`,
  }),
  execute: async () => ({
    name: 'Wanderlee Max',
    email: 'wanderleedev@gmail.com',
    linkedin: 'https://linkedin.com/in/wanderlee-max',
    github: 'https://github.com/WanderleeDev',
  }),
});

export const listTracks = tool({
  description:
    'Show the music tracks available in the portfolio\'s built-in player as a card. Use when the user asks what songs, music, or tracks are available, or wants to browse the playlist (e.g. "what music do you have?", "show me the playlist", "qué canciones hay?"). Do not use to play a track or control playback; use playTrack or controlTrack for those.',
  inputSchema: z.object({}),
  outputSchema: TrackListSchema,
  toModelOutput: ({ output }) => ({
    type: 'text',
    value: `Mostrados ${output.tracks.length} tracks en una tarjeta.`,
  }),
  execute: async () => ({
    titulo: 'Tracks',
    tracks: TRACKS.map(({ title, artist }) => ({
      titulo: title,
      artista: artist,
    })),
  }),
});

// Las dos que siguen se resuelven en el navegador (`onToolCall` en
// `useChatPanel`): necesitan el DOM del reproductor, así que no llevan `execute`.
export const playTrack = tool({
  description:
    'Start playing a specific track in the portfolio\'s music player. Use only when the user names or refers to a particular song, by title (full or partial) or by its position in the list (e.g. "play Midnight Drive", "play the third song", "pon la canción 2"). Do not use for generic transport commands like pause, skip, or go back without a specific track; use controlTrack for those.',
  inputSchema: z.object({
    track: z
      .string()
      .describe(
        'The track title, or part of it, or its 1-based position in the playlist (e.g. "3" for the third track)'
      ),
  }),
  outputSchema: PlaybackSchema,
});

export const controlTrack = tool({
  description:
    'Control playback of the music player without choosing a specific track: play or resume the current track, pause it, skip to the next track, or go back to the previous one. Use for transport commands (e.g. "pause the music", "next song", "go back", "resume", "pausa"). Do not use when the user asks for a specific song by name or position; use playTrack for that.',
  inputSchema: z.object({
    action: z
      .enum(['play', 'pause', 'next', 'prev'])
      .describe(
        'play: resume or start the current track; pause: pause playback; next: skip to the next track; prev: go back to the previous track'
      ),
  }),
  outputSchema: PlaybackSchema,
});

const KnowledgeHitSchema = z.object({
  score: z.number().describe('Relevance score of the hit'),
  texto: z.string().describe('Retrieved document chunk'),
});

export const KnowledgeSearchResultSchema = z.object({
  query: z.string().describe('The query that was searched'),
  hits: z.array(KnowledgeHitSchema).max(4).describe('Retrieved chunks, most relevant first'),
});

export type KnowledgeSearchResult = z.infer<typeof KnowledgeSearchResultSchema>;

export const searchKnowledgeBase = tool({
  description:
    'Search the knowledge base for detailed information about Wanderlee: specific projects (how they were built, problems solved, results), work experience, skills in context, education, background, and any other facts about the author. Use this as the default for questions about the author\'s work or background that the other tools do not cover, including follow-up questions about a specific project. Do not use for simple requests to list projects, technologies, contact details, or music; use the dedicated display tools for those. Write the query in the language that best matches the source content, and make it specific (e.g. "Wanderlee e-commerce project architecture" rather than "projects").',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'A specific search query describing the information needed, such as a project name, a technology, or a topic about the author'
      ),
  }),
  outputSchema: KnowledgeSearchResultSchema,
  execute: async ({ query }, { abortSignal }) => {
    const trimmed = query.trim();
    if (!trimmed) return { query, hits: [] };

    const { embedding } = await embed({
      value: trimmed,
      abortSignal,
      model: embeddingModel,
    });

    const hits = await searchCorpus(embedding, 4, trimmed);

    return {
      query,
      hits: hits.map(({ score, texto }) => ({ score, texto })),
    };
  },
});

export const tools = {
  displayProjects,
  displayTechs,
  displayContact,
  listTracks,
  playTrack,
  controlTrack,
  searchKnowledgeBase,
};