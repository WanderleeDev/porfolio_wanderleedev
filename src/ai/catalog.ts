import { z } from 'zod';

const projectEntrySchema = z.object({
    projectId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'use a lowercase slug'),
    nombre: z.string().trim().min(1),
    descripcion: z.string().trim().min(1),
    url: z.url().optional(),
});

export type ProjectCatalogEntry = z.infer<typeof projectEntrySchema>;

export const PROJECT_CATALOG: ProjectCatalogEntry[] = z
    .array(projectEntrySchema)
    .min(1)
    .max(12)
    .parse([
        {
            projectId: 'clior-ecommerce',
            nombre: 'Clior Ecommerce',
            descripcion:
                'E-commerce de productos nutricionales para mascotas (Clior Pets) en monorepo Nx: backend NestJS hexagonal, frontend Angular y e2e con Playwright.',
        },
        {
            projectId: 'flightontime',
            nombre: 'FlightOnTime',
            descripcion:
                'Sistema de predicción de retrasos de vuelos: backend Java, microservicio Python/FastAPI, notebooks de datos y dashboard Next.js.',
            url: 'https://github.com/WanderleeDev/Hackaton-Flightdelay',
        },
        {
            projectId: 'ngx-theme-stack',
            nombre: 'Ngx Theme Stack',
            descripcion:
                'Librería Angular SSR-safe para dark mode y temas con Signals, con schematics y app de demo/documentación.',
            url: 'https://ngx-theme-stack-docs.wanderlee.site/',
        },
        {
            projectId: 'llm-gateway',
            nombre: 'LLM Gateway',
            descripcion:
                'Gateway FastAPI que expone una API OpenAI-compatible sobre Ollama con autenticación, límite de concurrencia y embeddings.',
            url: 'https://llm.wanderlee.site/docs',
        },
        {
            projectId: 'ngx-iconify-stack',
            nombre: 'Ngx Iconify Stack',
            descripcion:
                'Wrapper Angular de Iconify con subsetting offline SSR-safe, publicado en npm con schematics y sitio de documentación.',
            url: 'https://ngx-iconify-stack-docs.wanderlee.site/',
        },
        {
            projectId: 'preguntonic',
            nombre: 'Preguntonic',
            descripcion:
                'Frontend Angular de un quiz multijugador en tiempo real con NgRx, STOMP/WebSocket y SSR.',
            url: 'https://preguntonic-test-1.netlify.app/home',
        },
        {
            projectId: 'pixel-pet',
            nombre: 'Pixel Pet',
            descripcion:
                'Web component Lit de una mascota pixel art que reacciona a eventos del chat; publicado en npm.',
            url: 'https://pixel-pet.wanderlee.site',
        },
        {
            projectId: 'learn-and-teach',
            nombre: 'Learn & Teach',
            descripcion:
                'Plataforma de e-learning fullstack: backend .NET con EF Core y frontend Angular 18, con cursos, roles y recursos.',
            url: 'https://learn-and-teach.vercel.app',
        },
        {
            projectId: 'fastty-chat',
            nombre: 'Fastty Chat',
            descripcion:
                'Chat colaborativo por salas en tiempo real: API Python/FastAPI con WebSockets y web Next.js.',
            url: 'https://fastty-chat.vercel.app',
        },
        {
            projectId: 'switch-2-clone',
            nombre: 'Switch 2 Clone',
            descripcion:
                'Clon de la landing de lanzamiento de Switch 2 en Vue 3 y Vite, con Tailwind 4 y Playwright.',
            url: 'https://dainty-pika-231bcd.netlify.app',
        },
    ]);

const techEntrySchema = z.object({
    nombre: z.string().trim().min(1),
    descripcion: z.string().trim().min(1),
    url: z.url(),
});

export type TechCatalogEntry = z.infer<typeof techEntrySchema>;

export const TECH_CATALOG: TechCatalogEntry[] = z
    .array(techEntrySchema)
    .min(1)
    .max(10)
    .parse([
        {
            nombre: 'TypeScript',
            descripcion: 'Lenguaje dominante: ~800 KB de código en los proyectos.',
            url: 'https://www.typescriptlang.org/',
        },
        {
            nombre: 'Angular',
            descripcion: 'Frontend principal de los proyectos propios.',
            url: 'https://angular.dev/',
        },
        {
            nombre: 'NestJS',
            descripcion: 'Backend de las APIs con arquitectura por capas.',
            url: 'https://nestjs.com/',
        },
        {
            nombre: 'PostgreSQL',
            descripcion: 'Base de datos relacional principal del backend.',
            url: 'https://www.postgresql.org/',
        },
        {
            nombre: 'Node.js',
            descripcion: 'Runtime de las APIs y herramientas del ecosistema.',
            url: 'https://nodejs.org/',
        },
        {
            nombre: 'Python',
            descripcion: 'Adopción reciente en llm-gateway y fastty-chat.',
            url: 'https://www.python.org/',
        },
        {
            nombre: 'FastAPI',
            descripcion: 'Framework de los servicios Python recientes.',
            url: 'https://fastapi.tiangolo.com/',
        },
        {
            nombre: 'Docker',
            descripcion: 'Contenedores para desarrollo y despliegue.',
            url: 'https://www.docker.com/',
        },
        {
            nombre: 'Astro',
            descripcion: 'Framework de este portfolio con islas de React.',
            url: 'https://astro.build/',
        },
        {
            nombre: 'React',
            descripcion: 'Usado en fastty-chat y en la UI del portfolio.',
            url: 'https://react.dev/',
        },
    ]);
