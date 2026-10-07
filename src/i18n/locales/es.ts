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
      },
      {
        title: "Familiarizado con",
        accent: "#8b5cf6",
        techs: [
          { color: "#ffc331", icon: "devicon:python" },
          { color: "#009688", icon: "devicon:fastapi" },
          { color: "#42b883", icon: "devicon:vuejs" },
          { color: "#ffffff", icon: "devicon:express" },
          { color: "#8C38EF", icon: "devicon:bootstrap" },
        ],
      },
      {
        title: "Herramientas",
        accent: "#10b981",
        techs: [
          { color: "#F05032", icon: "devicon:git" },
          { color: "#9e9e9e", icon: "devicon:github" },
          { color: "#2496ED", icon: "devicon:docker" },
          { color: "#0079BF", icon: "devicon:trello" },
        ],
      },
    ],
    attr_data: "skills",
  },

  journey: {
    introTitle: "Mi stack, de punta a punta",
    outroTitle: "Ahora, lo que hice con ellas",
    outroDesc: "Sigue bajando para ver los proyectos.",
    skillDescriptions: {
      "Mi Stack": "Las herramientas que uso en la mayoría de mis proyectos.",
      Frontend: "Interfaces, animación e interacción.",
      Backend: "APIs, datos y lógica de negocio.",
      "Familiarizado con": "Tecnologías que manejo y sigo explorando.",
      Herramientas: "Diseño, versiones y despliegue.",
    },
  },

  projects: {
    sectionTitle: "Proyectos",
    sectionDescription:
      "Proyectos fullstack que demuestran mi dominio en frontend, backend y arquitectura de aplicaciones.",
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
    attr_data: "projects",
  },
};
