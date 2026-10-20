export const es = {
  metadata: {
    title: "Portafolio WanderleeDev",
    description:
      "Portafolio de WanderleeDev, desarrollador web mostrando proyectos y habilidades.",
    keywords:
      "portafolio, WanderleeDev, desarrollador web, proyectos, habilidades",
    thumbnail:
      "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765775796/porfolio_es_u4q2rs.webp",
  },

  skills: {
    sectionTitle: "Tecnologías",
    sectionDescription:
      "Herramientas modernas que utilizo para construir experiencias web rápidas, escalables y accesibles.",
    alsoUsedLabel: "Ocasionalmente usado",
    list: [
      {
        title: "Mi Stack",
        accent: "#f59e0b",
        techs: [
          { color: "#336791", icon: "devicon:postgresql" },
          { color: "#E0234E", icon: "devicon:nestjs" },
          { color: "#DD0031", icon: "devicon:angular" },
          { color: "#339933", icon: "devicon:nodejs" },
        ],
      },
      {
        title: "Frontend",
        accent: "#06b6d4",
        techs: [
          { color: "#E44D26", icon: "devicon:html5" },
          { color: "#4884B7", icon: "devicon:css3" },
          { color: "#F0DB4F", icon: "devicon:javascript" },
          { color: "#007ACC", icon: "devicon:typescript" },
          { color: "#00d8ff", icon: "devicon:react" },
          { color: "#9e9e9e", icon: "devicon:nextjs" },
          { color: "#DD0031", icon: "devicon:angular" },
          { color: "#ff5d01", icon: "devicon:astro" },
          { color: "#CC6699", icon: "devicon:sass" },
          { color: "#06B6D4", icon: "devicon:tailwindcss" },
          { color: "#d2227d", icon: "devicon:ngrx" },
          { color: "#82D701", icon: "simple-icons:greensock" },
        ],
        alsoUsed: [
          { color: "#42b883", icon: "devicon:vuejs" },
          { color: "#8C38EF", icon: "devicon:bootstrap" },
        ],
      },
      {
        title: "Backend",
        accent: "#e0234e",
        techs: [
          { color: "#339933", icon: "devicon:nodejs" },
          { color: "#E0234E", icon: "devicon:nestjs" },
          { color: "#336791", icon: "devicon:postgresql" },
          { color: "#ED8B00", icon: "devicon:java" },
          { color: "#6DB33F", icon: "devicon:spring" },
        ],
        alsoUsed: [
          { color: "#ffc331", icon: "devicon:python" },
          { color: "#009688", icon: "devicon:fastapi" },
          { color: "#ffffff", icon: "devicon:express" },
        ],
      },
      {
        title: "AI & Tools",
        accent: "#10b981",
        techs: [
          { color: "#F05032", icon: "devicon:git" },
          { color: "#9e9e9e", icon: "devicon:github" },
          { color: "#2496ED", icon: "devicon:docker" },
          { color: "#0079BF", icon: "devicon:trello" },
          { color: "#0000F2", icon: "selfhst:hermes-agent", name: "Hermes Agent" },
          { color: "#007ACC", icon: "devicon:vscode", name: "VS Code" },
          { color: "#10A37F", icon: "simple-icons:openai", name: "Codex" },
          { color: "#9e9e9e", icon: "vscode-icons:file-type-opencode", name: "OpenCode" },
          { color: "#8b5cf6", icon: "arcticons:pi-1", name: "Pi" },
        ],
        alsoUsed: [
          { color: "#FE2857", icon: "devicon:intellij", name: "IntelliJ IDEA" },
        ],
      },
    ],
  },

  journey: {
    skillDescriptions: {
      "Mi Stack": "Las herramientas que uso en la mayoría de mis proyectos.",
      Frontend: "Interfaces, animación e interacción.",
      Backend: "APIs, datos y lógica de negocio.",
      "AI & Tools": "IA, diseño, versiones y despliegue."
    },
  },

  projects: {
    list: [
      {
        title: "Ecommerce",
        description:
          "Ecommerce con sistema de autenticación, carrito de compras, notificaciones y uso de local storage",
        demo_url: "https://clior.vercel.app/",
        technologies: ["angular", "sass", "typeScript", "flowbite"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154110/clior_biw8pq.webp",
        label: "ver demo ecommerce",
      },
      {
        title: "Ubuntu desktop",
        description:
          "Copia funcional del escritorio de Ubuntu 22.0.4, calendario, terminal, editor de código entre otros",
        demo_url: "https://github.com/",
        technologies: ["angular", "tailwindCss", "typeScript", "ngrx"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154111/ubuntu_e1zsgq.webp",
        label: "ver demo ubuntu",
      },
      {
        title: "Ngx-theme-stack",
        description: "Biblioteca de Angular moderna y compatible con SSR para gestionar el modo oscuro, el modo claro y temas personalizados a través de Angular Signals.",
        demo_url: "https://demo-ngx-theme-stack.wanderlee.site/",
        technologies: ["angular", "typeScript"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1779674696/thumbnail_tkxkkw.jpg",
        label: "ver demo ngx-theme-stack",
      },
      {
        title: "Switch 2 Clone",
        description:
          "Desarrollado usando unidades de viewport para lograr un diseño responsive a mayor escala",
        demo_url: "https://dainty-pika-231bcd.netlify.app/",
        technologies: ["vue", "tailwindCss", "typeScript"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154111/nintendo_shots_b0pr6w.webp",
        label: "ver demo switch 2 clone",
      },
    ],
  },

  hero: {
    title: "Fullstack,",
    titleAccent: "diseño",
    titleEnd: "moderno.",
    subtitle: "Stack principal",
  },

  featuredWork: {
    title: "Trabajos Destacados",
    subtitle: "Proyectos recientes y notables",
    prev: "Proyecto anterior",
    next: "Proyecto siguiente",
    close: "Cerrar",
    personal: "Trabajo personal",
    demo: "Ver demo",
  },

  contactSection: {
    title: "Hablemos",
    subtitle: "¿Listo para empezar tu próximo proyecto? Envíame un mensaje y lo hacemos realidad.",
    submit: "Abrir en mi correo",
    preferredText: "¿Prefieres escribir tú?",
    fields: {
      kind: "Tipo de proyecto",
      name: "Nombre",
      what: "Empresa o idea",
      email: "Correo",
    },
    status: {
      sending: "Enviando...",
      success: "Mensaje enviado. ¡Gracias!",
      error: "No se pudo enviar. Intentalo de nuevo.",
    },
    labels: [
      { label: "tu nombre", key: "name" },
      { label: "tu empresa o idea", key: "what" },
      { label: "tu@correo.com", key: "email" },
    ],
    kinds: ["una web nueva", "rediseñar mi sitio", "una app a medida", "animaciones para mi producto", "otra cosa"],
    error: "Falta tu nombre en la frase.",
    errorWhat: "Cuéntame para qué empresa o idea es.",
    errorEmail: "Escribe un correo válido, por ejemplo nombre@dominio.com.",
  },

  chat: {
    title: "Chat",
    subtitle: "Preguntame sobre mi trabajo",
    open: "Abrir chat",
    close: "Cerrar chat",
    fullscreen: "Pantalla completa",
    clear: "Limpiar",
    asked: "Preguntaste:",
    empty: "Hola! Soy el asistente de este portafolio. Preguntame por los proyectos, el stack o cómo contactarme.",
    placeholder: "Escribí un mensaje…",
    typing: "Escribiendo…",
    send: "Enviar",
    stop: "Detener",
    error: "No pude responder. Probá de nuevo.",
  },

  footer: {
    tagline: "Fullstack developer",
    contactLabel: "Contacto",
    email: "wanderleedev@gmail.com",
    ctaLabel: "Empezar un proyecto",
    ctaAria: "Volver a la sección de contacto",
    backToTop: "Volver arriba",
    rights: "© 2026 WanderleeDev. Todos los derechos reservados.",
  },
};
