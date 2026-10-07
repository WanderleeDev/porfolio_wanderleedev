export const en = {
  metadata: {
    title: "Portfolio WanderleeDev",
    description:
      "Portfolio of WanderleeDev, a web developer showcasing projects and skills.",
    keywords: "portfolio, WanderleeDev, web developer, projects, skills",
    thumbnail:
      "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765775796/porfolio_en_onrfod.webp",
  },

  skills: {
    sectionTitle: "Tech",
    sectionDescription:
      "Modern tools I use to build fast, scalable, and accessible web experiences.",
    list: [
      {
        title: "My Stack",
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
        title: "Familiar With",
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
        title: "Tools",
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
    introTitle: "My stack, end to end",
    outroTitle: "Now, what I built with them",
    outroDesc: "Keep scrolling to see the projects.",
    skillDescriptions: {
      "My Stack": "The tools I use for most of my projects.",
      Frontend: "UI, animation, and interaction.",
      Backend: "APIs, data, and business logic.",
      "Familiar With": "Technologies I know and keep exploring.",
      Tools: "Design, versioning, and deployment.",
    },
  },

  projects: {
    sectionTitle: "Projects",
    sectionDescription:
      "Fullstack projects showcasing my expertise in frontend, backend, and application architecture.",
    list: [
      {
        title: "Ecommerce",
        description:
          "Ecommerce with authentication system, shopping cart, notifications, and local storage usage",
        demo_url: "https://clior.vercel.app/",
        technologies: ["angular", "sass", "typeScript", "flowbite"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154110/clior_biw8pq.webp",
        label: "view ecommerce demo",
      },
      {
        title: "Ubuntu desktop",
        description:
          "Functional copy of Ubuntu 22.0.4 desktop, calendar, terminal, code editor among others",
        demo_url: "https://github.com/",
        technologies: ["angular", "tailwindCss", "typeScript", "ngrx"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154111/ubuntu_e1zsgq.webp",
        label: "view ubuntu demo",
      },
      {
        title: "Ngx-theme-stack",
        description: "Modern, SSR-safe Angular library for managing dark mode, light mode, and custom themes via Angular Signals.",
        demo_url: "https://demo-ngx-theme-stack.wanderlee.site/",
        technologies: ["angular", "typeScript"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1779674696/thumbnail_tkxkkw.jpg",
        label: "view ngx-theme-stack demo",
      },
      {
        title: "Switch 2 Clone",
        description:
          "Developed using viewport units to achieve a responsive design on a larger scale",
        demo_url: "https://dainty-pika-231bcd.netlify.app/",
        technologies: ["vue", "tailwindCss", "typeScript"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154111/nintendo_shots_b0pr6w.webp",
        label: "view switch 2 clone demo",
      },
    ],
    attr_data: "projects",
  },
};
