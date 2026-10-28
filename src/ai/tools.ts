import { tool } from 'ai';
import { z } from 'zod';
import { ProjectListSchema, TechListSchema, ContacSchema } from './ui-schema';

export const displayProjects = tool({
  description: 'Devolver la lista de proyectos del portfolio como tarjetas',
  inputSchema: z.object({}),
  outputSchema: ProjectListSchema,
  toModelOutput: ({ output }) => ({
        type: "text",
        value: `Mostrados ${output.proyectos.length} proyectos en una tarjeta.`,
    }),
  execute: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      titulo: 'Proyectos destacados',
      proyectos: [
        {
          nombre: 'WanderDev Portfolio',
          descripcion: 'Portafolio personal construido con Astro, TSX y un chat RAG sobre el propio CV.',
          url: 'https://github.com/wanderlee/porfolio_wanderleedev',
        },
        {
          nombre: 'Qdrant Catalog',
          descripcion: 'Catálogo vectorial con búsqueda híbrida para indexar y consultar documentos PDF.',
          url: 'https://github.com/wanderlee/qdrant-catalog',
        },
        {
          nombre: 'AI Chat Panel',
          descripcion: 'Panel de chat con streaming de respuestas y tarjetas de proyectos generadas por herramientas.',
          url: 'https://github.com/wanderlee/ai-chat-panel',
        },
      ],
    };
  },
});

export const displayTechs = tool({
  description: 'Devolver las tecnologías usadas en los proyectos como tarjetas',
  inputSchema: z.object({}),
  outputSchema: TechListSchema,
  execute: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      titulo: 'Tecnologías',
      techs: [
        {
          nombre: 'Astro',
          descripcion: 'Framework de sitio estático con islas de interactividad en React.',
          url: 'https://astro.build',
        },
        {
          nombre: 'AI SDK',
          descripcion: 'Streaming de texto y ejecución de herramientas del agente de chat.',
          url: 'https://ai-sdk.dev',
        },
        {
          nombre: 'Qdrant',
          descripcion: 'Base de datos vectorial para la búsqueda híbrida del RAG.',
          url: 'https://qdrant.tech',
        },
        {
          nombre: 'TypeScript',
          descripcion: 'Lenguaje tipado para el frontend y las rutas de la API.',
          url: 'https://www.typescriptlang.org',
        },
      ],
    };
  },
});

export const displayContact = tool({
  description: 'Devolver los datos de contacto del autor del portfolio',
  inputSchema: z.object({}),
  outputSchema: ContacSchema,
  execute: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      name: 'Wander Lee',
      email: 'hello@wanderdev.example.com',
      linkedin: 'https://www.linkedin.com/in/wanderlee',
      github: 'https://github.com/wanderlee',
    };
  },
});

export const tools = {
  displayProjects,
  displayTechs,
  displayContact,
};
