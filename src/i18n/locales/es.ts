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
    start: "Inspirando",
    accent: "Start-ups,",
    middle: "una",
    end_prefix: "historia a la",
    end_highlight: "vez.",
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
        techs: [
          { color: "#13AA52", icon: "devicon:mongodb" },
          { color: "#9e9e9e", icon: "devicon:express" },
          { color: "#DD0031", icon: "devicon:angular" },
          { color: "#339933", icon: "devicon:nodejs" },
        ],
      },
      {
        title: "Frontend",
        techs: [
          { color: "#E44D26", icon: "devicon:html5" },
          { color: "#4884B7", icon: "devicon:css3" },
          { color: "#F0DB4F", icon: "devicon:javascript" },
          { color: "#007ACC", icon: "devicon:typescript" },
          { color: "#00d8ff", icon: "devicon:react" },
          { color: "#9e9e9e", icon: "devicon:nextjs" },
          { color: "#ff5d01", icon: "devicon:astro" },
          { color: "#CC6699", icon: "devicon:sass" },
          { color: "#06B6D4", icon: "devicon:tailwindcss" },
          { color: "#d2227d", icon: "devicon:ngrx" },
        ],
      },
      {
        title: "Backend",
        techs: [
          { color: "#ffc331", icon: "devicon:python" },
          { color: "#009688", icon: "devicon:fastapi" },
          { color: "#E0234E", icon: "devicon:nestjs" },
          { color: "#ED8B00", icon: "devicon:java" },
          { color: "#6DB33F", icon: "devicon:spring" },
        ],
      },
      {
        title: "Otros",
        techs: [
          { color: "#42b883", icon: "devicon:vuejs" },
          { color: "#00DC82", icon: "devicon:nuxtjs" },
          { color: "#8C38EF", icon: "devicon:bootstrap" },
        ],
      },
      {
        title: "Herramientas",
        techs: [
          { color: "#F05032", icon: "devicon:git" },
          { color: "#9e9e9e", icon: "devicon:github" },
          { color: "#2496ED", icon: "devicon:docker" },
          { color: "#0079BF", icon: "devicon:trello" },
        ],
      },
    ],
  },

  projects: {
    sectionTitle: "Proyectos",
    sectionDescription:
      "Mi selección personal de proyectos frontend, donde destaco ejemplos que muestran mi enfoque en el desarrollo web centrado en la calidad y el usuario.",
    list: [
      {
        title: "Ecommerce",
        description:
          "Ecommerce con sistema de autenticación, carrito de compras, notificaciones y uso de local storage",
        problem:
          "Los usuarios necesitaban una experiencia de compra fluida con persistencia de datos del carrito y notificaciones en tiempo real para actualizaciones de pedidos.",
        solution:
          "Construí una plataforma de ecommerce completa con Angular, implementando autenticación JWT, local storage para persistencia del carrito y un sistema de notificaciones para el seguimiento de pedidos.",
        impact:
          "Creé una experiencia de compra intuitiva con un proceso de pago un 40% más rápido y mejor retención de usuarios a través de la funcionalidad de carrito persistente.",
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
        problem:
          "Demostrar gestión de estado compleja y arquitectura de componentes en un escenario de aplicación del mundo real.",
        solution:
          "Recreé el entorno de escritorio de Ubuntu usando Angular y NgRx para gestión de estado, implementando componentes funcionales de terminal, calendario y editor de código.",
        impact:
          "Mostró habilidades avanzadas en Angular y patrones de gestión de estado, demostrando capacidad para construir aplicaciones complejas e interactivas.",
        demo_url: "https://github.com/",
        technologies: ["angular", "tailwindCss", "typeScript", "ngrx"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154111/ubuntu_e1zsgq.webp",
        label: "ver demo ubuntu",
      },
      {
        title: "Retro Blog",
        description:
          "Desarrollado con la librería Nes CSS, presenta pequeños blogs de contenido estático y usa animaciones de scroll CSS",
        problem:
          "Crear una experiencia de blog atractiva con estética retro única mientras se mantiene el rendimiento web moderno.",
        solution:
          "Aproveché Astro para generación de sitios estáticos y Nes CSS para estilo retro, implementando animaciones de scroll CSS para una experiencia de lectura interactiva.",
        impact:
          "Logré una puntuación Lighthouse de 95+ con identidad visual única, demostrando capacidad para mezclar creatividad con rendimiento.",
        demo_url: "https://retro-blog-two.vercel.app/",
        technologies: ["astro", "css", "typeScript"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154110/retro_blog_fejpmv.webp",
        label: "ver demo retro blog",
      },
      {
        title: "Switch 2 Clone",
        description:
          "Desarrollado usando unidades de viewport para lograr un diseño responsive a mayor escala",
        problem:
          "Crear un clon responsive pixel-perfect de la landing page de Nintendo Switch 2 en todos los tamaños de dispositivo.",
        solution:
          "Utilicé Vue 3 y Tailwind CSS con unidades de viewport para escalado fluido, asegurando experiencia visual consistente en dispositivos.",
        impact:
          "Entregué un diseño responsive que escala perfectamente desde móviles hasta pantallas 4K, mostrando habilidades avanzadas de CSS y diseño responsive.",
        demo_url: "https://dainty-pika-231bcd.netlify.app/",
        technologies: ["vue", "tailwindCss", "typeScript"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154111/nintendo_shots_b0pr6w.webp",
        label: "ver demo switch 2 clone",
      },
    ],
  },

  extras: {
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
        label: "Enfoque",
        gradient: "bg-linear-to-r from-purple-400 to-pink-400",
      },
    ],
    list: [
      {
        title: "Ecosistema Angular",
        icon: "Angular",
        description: "Explora mis aplicaciones y componentes.",
        link: "https://entry-page-angular.vercel.app/",
      },
      {
        title: "Ecosistema React",
        icon: "React",
        link: "https://react-showcase-three.vercel.app/",
        description: "Explora mis aplicaciones y componentes.",
      },
      {
        title: "Ecosistema Vue",
        icon: "Vuejs",
        link: "https://vue-showcase-8bg.pages.dev/",
        description: "Explora mis aplicaciones y componentes.",
      },
    ],
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
  },

  navLinks: [
    {
      name: "skills",
      icon: "ri:code-s-slash-line",
      label: "Tecnologías",
    },
    {
      name: "projects",
      icon: "ri:folder-2-line",
      label: "Proyectos",
    },
    {
      name: "extras",
      icon: "ri:archive-2-line",
      label: "Laboratorio",
    },
    {
      name: "contact",
      icon: "ri:chat-1-line",
      label: "Hablemos",
    },
  ],
};
