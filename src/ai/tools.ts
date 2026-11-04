import { tool } from 'ai';
import { z } from 'zod';
import { ProjectListSchema, TechListSchema, ContacSchema, TrackListSchema, PlaybackSchema } from './ui-schema';
import { PROJECT_CATALOG, TECH_CATALOG } from './catalog';
import { TRACKS } from '../components/music-player/tracks';

const PROJECT_CARDS = PROJECT_CATALOG.map(({ nombre, descripcion, url }) => ({
  nombre,
  descripcion,
  ...(url ? { url } : {}),
}));

export const displayProjects = tool({
  description: 'Devolver la lista de proyectos del portfolio como tarjetas',
  inputSchema: z.object({}),
  outputSchema: ProjectListSchema,
  toModelOutput: ({ output }) => ({
    type: "text",
    value: `Mostrados ${output.proyectos.length} proyectos en una tarjeta.`,
  }),
  execute: async () => ({
    titulo: 'Proyectos',
    proyectos: PROJECT_CARDS,
  }),
});

export const displayTechs = tool({
  description: 'Devolver las tecnologías usadas en los proyectos como tarjetas',
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
  description: 'Devolver los datos de contacto del autor del portfolio',
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
  description: 'Devolver los tracks de música disponibles en el reproductor del portfolio',
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
    'Reproducir un track puntual del reproductor del portfolio. Acepta el título o la posición en la lista.',
  inputSchema: z.object({
    track: z.string().describe('Track title (or part of it) or its 1-based position in the list'),
  }),
  outputSchema: PlaybackSchema,
});

export const controlTrack = tool({
  description: 'Controlar el reproductor del portfolio: play, pause, next o prev',
  inputSchema: z.object({
    action: z.enum(['play', 'pause', 'next', 'prev']).describe('Transport action to run'),
  }),
  outputSchema: PlaybackSchema,
});

export const tools = {
  displayProjects,
  displayTechs,
  displayContact,
  listTracks,
  playTrack,
  controlTrack,
};
