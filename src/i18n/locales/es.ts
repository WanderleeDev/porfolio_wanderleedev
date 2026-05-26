export const es = {
  nav: {
    mobileMenuLabel: "Menú móvil",
  },
  metadata: {
    title: "Portafolio WanderleeDev",
    description:
      "Portafolio de WanderleeDev, desarrollador web mostrando proyectos y habilidades.",
    keywords:
      "portafolio, WanderleeDev, desarrollador web, proyectos, habilidades",
    thumbnail:
      "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765775796/porfolio_es_u4q2rs.webp",
  },
  social: [
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/wanderlee-max/",
      icon: "mdi:linkedin",
    },
    {
      name: "Github",
      url: "https://github.com/WanderleeDev",
      icon: "mdi:github",
    },
    {
      name: "Portafolio",
      url: "",
      icon: "mdi:briefcase",
    },
  ],
  footer: {
    developedBy: "WanderleeDev © 2025",
    socialLinksAria: "Enlaces a redes sociales",
    description: "Disponible para colaboraciones y nuevos proyectos.",
    viewCode: {
      text: "Ver Código",
      url: "https://github.com/WanderleeDev/porfolio_2025",
    },
  },

  badge: {
    label: "Ir al GitHub de WanderleeDev",
  },
  presentation: {
    start: "Perfil",
    accent: "Fullstack,",
    middle: "y",
    end_prefix: "diseño",
    end_highlight: "moderno.",
    attr_data: "presentation",
  },
  form: {
    name: {
      label: "Nombre",
      placeholder: "Tu nombre",
    },
    email: {
      label: "Correo electrónico",
      placeholder: "tu@email.com",
    },
    subject: {
      label: "Asunto",
      placeholder: "Consulta sobre proyecto",
    },
    message: {
      label: "Mensaje",
      placeholder: "Cuéntame sobre tu proyecto...",
    },
    submit: "Enviar Mensaje",
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

  playground: {
    sectionTitle: "Laboratorio",
    sectionDescription: "Experimentos y demos donde pruebo nuevas tecnologías.",
    stats: [
      {
        value: "Continuo",
        label: "Aprendizaje",
        gradient: "bg-linear-to-r from-cyan-400 to-blue-400",
      },
      {
        value: "Frontend",
        label: "Especialidad",
        gradient: "bg-linear-to-r from-purple-400 to-pink-400",
      },
    ],
    list: [
      {
        title: "Ecosistema Angular",
        icon: "Angular",
        description: "Arquitectura robusta con gestión de estado avanzada usando NgRx y programación reactiva con RxJS.",
        capsules: ["TypeScript", "Signals", "RxJS", "NgRx Store", "NgRx Signals", "Angular Material", "Angular CDK", "Angular CLI", "Reactive Forms"],
        link: "https://entry-page-angular.vercel.app/",
      },
      {
        title: "Ecosistema React",
        icon: "React",
        description: "Aplicaciones altamente interactivas construidas sobre Next.js, optimizadas para rendimiento y SEO.",
        capsules: ["Zustand", "TypeScript", "Next.js", "React Hook Form", "Zod", "React Query", "Axios", "Shadcn"],
        link: "https://react-showcase-three.vercel.app/",
      },
    ],
    attr_data: "playground",
  },

  contactSection: {
    title: "Hablemos",
    description:
      "¿Listo para empezar tu próximo proyecto? Envíame un mensaje y lo hacemos realidad.",
    info: [
      {
        icon: "mdi:email-outline",
        label: "Correo electrónico",
        value: "xamperu3@gmail.com",
      },
      {
        icon: "mdi:map-marker-outline",
        label: "Ubicación",
        value: "Lima, Perú",
      },
      {
        icon: "mdi:clock-outline",
        label: "Tiempo de Respuesta",
        value: "Dentro de 24 horas",
      },
    ],
    attr_data: "contact",
  },

  navLinks: [
    {
      name: "projects",
      icon: "ri:folder-2-line",
      label: "Proyectos",
      attr_data: "projects",
    },
    {
      name: "skills",
      icon: "ri:code-s-slash-line",
      label: "Tecnologías",
      attr_data: "skills",
    },
    {
      name: "playground",
      icon: "ri:archive-2-line",
      label: "Laboratorio",
      attr_data: "playground",
    },
    {
      name: "contact",
      icon: "ri:chat-1-line",
      label: "Hablemos",
      attr_data: "contact",
    },
  ],
};
