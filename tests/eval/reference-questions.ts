export type CardTool = "displayProjects" | "displayTechs" | "displayContact";

export type ReferenceExpectation =
    | { tipo: "herramienta"; herramienta: CardTool }
    | { tipo: "narrativa" }
    | { tipo: "rechazo" };

export interface ReferenceQuestion {
    id: string;
    pregunta: string;
    expectativa: ReferenceExpectation;
}

export const REFERENCE_QUESTIONS: ReferenceQuestion[] = [
    { id: "proyectos-basico", pregunta: "Mostrame tus proyectos", expectativa: { tipo: "herramienta", herramienta: "displayProjects" } },
    { id: "proyectos-tarjetas", pregunta: "Quiero ver las tarjetas de proyectos", expectativa: { tipo: "herramienta", herramienta: "displayProjects" } },
    { id: "proyectos-lista", pregunta: "¿Qué proyectos hiciste?", expectativa: { tipo: "herramienta", herramienta: "displayProjects" } },
    { id: "techs-basico", pregunta: "Mostrame las tecnologías que usás", expectativa: { tipo: "herramienta", herramienta: "displayTechs" } },
    { id: "techs-stack", pregunta: "¿Cuál es tu stack principal?", expectativa: { tipo: "herramienta", herramienta: "displayTechs" } },
    { id: "techs-dominio", pregunta: "¿Qué tecnologías dominás?", expectativa: { tipo: "herramienta", herramienta: "displayTechs" } },
    { id: "contacto-basico", pregunta: "¿Cómo te contacto?", expectativa: { tipo: "herramienta", herramienta: "displayContact" } },
    { id: "contacto-datos", pregunta: "Pasame tu email y tu LinkedIn", expectativa: { tipo: "herramienta", herramienta: "displayContact" } },
    { id: "contacto-github", pregunta: "¿Cuál es tu GitHub?", expectativa: { tipo: "herramienta", herramienta: "displayContact" } },

    { id: "clior-arquitectura", pregunta: "¿Cómo está organizado clior-ecommerce?", expectativa: { tipo: "narrativa" } },
    { id: "llm-gateway", pregunta: "Contame qué hace llm-gateway", expectativa: { tipo: "narrativa" } },
    { id: "fastty-defecto", pregunta: "¿Qué defecto tiene fastty-chat?", expectativa: { tipo: "narrativa" } },
    { id: "forks", pregunta: "¿Qué proyectos son forks?", expectativa: { tipo: "narrativa" } },
    { id: "java", pregunta: "¿Usaste Java en algún proyecto propio?", expectativa: { tipo: "narrativa" } },
    { id: "proyecto-completo", pregunta: "¿Cuál es tu proyecto más completo?", expectativa: { tipo: "narrativa" } },
    { id: "iconify", pregunta: "¿Qué hace ngx-iconify-stack?", expectativa: { tipo: "narrativa" } },
    { id: "seguridad", pregunta: "¿Cómo manejás seguridad en tus APIs?", expectativa: { tipo: "narrativa" } },
    { id: "commits", pregunta: "¿Cuántos commits tenés en total?", expectativa: { tipo: "narrativa" } },
    { id: "pixel-pet", pregunta: "Contame sobre pixel-pet", expectativa: { tipo: "narrativa" } },

    { id: "capital-francia", pregunta: "¿Cuál es la capital de Francia?", expectativa: { tipo: "rechazo" } },
    { id: "clima-lima", pregunta: "¿Qué clima hace hoy en Lima?", expectativa: { tipo: "rechazo" } },
    { id: "tarifa", pregunta: "¿Cuánto cobrás por hora?", expectativa: { tipo: "rechazo" } },
    { id: "rust", pregunta: "¿Trabajaste con Rust?", expectativa: { tipo: "rechazo" } },
    { id: "telefono", pregunta: "¿Cuál es tu número de teléfono?", expectativa: { tipo: "rechazo" } },
];
