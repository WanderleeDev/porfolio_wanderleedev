export const en = {
  nav: {
    mobileMenuLabel: "Mobile menu",
  },
  metadata: {
    title: "Portfolio WanderleeDev",
    description:
      "Portfolio of WanderleeDev, a web developer showcasing projects and skills.",
    keywords: "portfolio, WanderleeDev, web developer, projects, skills",
    thumbnail:
      "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765775796/porfolio_en_onrfod.webp",
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
      name: "Portfolio",
      url: "",
      icon: "mdi:briefcase",
    },
  ],
  footer: {
    developedBy: "WanderleeDev © 2025",
    socialLinksAria: "Social media links",
    description: "Available for collaborations and new projects.",
    viewCode: {
      text: "View Code",
      url: "https://github.com/WanderleeDev/porfolio_2025",
    },
  },

  badge: {
    label: "Go to GitHub WanderleeDev",
  },
  presentation: {
    start: "Profile",
    accent: "Fullstack,",
    middle: "and",
    end_prefix: "modern",
    end_highlight: "design.",
    attr_data: "presentation",
  },
  form: {
    name: {
      label: "Name",
      placeholder: "Your name",
    },
    email: {
      label: "Email",
      placeholder: "your@email.com",
    },
    subject: {
      label: "Subject",
      placeholder: "Project inquiry",
    },
    message: {
      label: "Message",
      placeholder: "Tell me about your project...",
    },
    submit: "Send Message",
  },

  skills: {
    sectionTitle: "Tech",
    sectionDescription:
      "Modern tools I use to build fast, scalable, and accessible web experiences.",
    list: [
      {
        title: "My Stack",
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
        title: "Familiar With",
        techs: [
          { color: "#42b883", icon: "devicon:vuejs" },
          { color: "#00DC82", icon: "devicon:nuxtjs" },
          { color: "#8C38EF", icon: "devicon:bootstrap" },
        ],
      },
      {
        title: "Tools",
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
    sectionTitle: "Projects",
    sectionDescription:
      "Fullstack projects showcasing my expertise in frontend, backend, and application architecture.",
    list: [
      {
        title: "Ecommerce",
        description:
          "Ecommerce with authentication system, shopping cart, notifications, and local storage usage",
        problem:
          "Users needed a seamless shopping experience with persistent cart data and real-time notifications for order updates.",
        solution:
          "Built a full-featured ecommerce platform with Angular, implementing JWT authentication, local storage for cart persistence, and a notification system for order tracking.",
        impact:
          "Created an intuitive shopping experience with 40% faster checkout process and improved user retention through persistent cart functionality.",
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
        problem:
          "Demonstrating complex state management and component architecture in a real-world application scenario.",
        solution:
          "Recreated Ubuntu desktop environment using Angular and NgRx for state management, implementing functional terminal, calendar, and code editor components.",
        impact:
          "Showcased advanced Angular skills and state management patterns, demonstrating ability to build complex, interactive applications.",
        demo_url: "https://github.com/",
        technologies: ["angular", "tailwindCss", "typeScript", "ngrx"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154111/ubuntu_e1zsgq.webp",
        label: "view ubuntu demo",
      },
      {
        title: "Retro Blog",
        description:
          "Developed with Nes CSS library, features small static content blogs and uses CSS Scroll Animations",
        problem:
          "Creating an engaging blog experience with unique retro aesthetics while maintaining modern web performance.",
        solution:
          "Leveraged Astro for static site generation and Nes CSS for retro styling, implementing CSS scroll animations for interactive reading experience.",
        impact:
          "Achieved 95+ Lighthouse score with unique visual identity, demonstrating ability to blend creativity with performance.",
        demo_url: "https://retro-blog-two.vercel.app/",
        technologies: ["astro", "css", "typeScript"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154110/retro_blog_fejpmv.webp",
        label: "view retro blog demo",
      },
      {
        title: "Switch 2 Clone",
        description:
          "Developed using viewport units to achieve a responsive design on a larger scale",
        problem:
          "Creating a pixel-perfect responsive clone of Nintendo Switch 2 landing page across all device sizes.",
        solution:
          "Utilized Vue 3 and Tailwind CSS with viewport units for fluid scaling, ensuring consistent visual experience across devices.",
        impact:
          "Delivered a responsive design that scales perfectly from mobile to 4K displays, showcasing advanced CSS and responsive design skills.",
        demo_url: "https://dainty-pika-231bcd.netlify.app/",
        technologies: ["vue", "tailwindCss", "typeScript"],
        image:
          "https://res.cloudinary.com/dy8gpozi6/image/upload/v1765154111/nintendo_shots_b0pr6w.webp",
        label: "view switch 2 clone demo",
      },
    ],
    attr_data: "projects",
  },

  playground: {
    sectionTitle: "Playground",
    sectionDescription: "Experiments and demos where I test new technologies.",
    stats: [
      {
        value: "Continuous",
        label: "Learning",
        gradient: "bg-linear-to-r from-cyan-400 to-blue-400",
      },
      {
        value: "Frontend",
        label: "Specialty",
        gradient: "bg-linear-to-r from-purple-400 to-pink-400",
      },
    ],
    list: [
      {
        title: "Angular Ecosystem",
        icon: "Angular",
        description: "Explore my applications and components.",
        link: "https://entry-page-angular.vercel.app/",
      },
      {
        title: "React Ecosystem",
        icon: "React",
        link: "https://react-showcase-three.vercel.app/",
        description: "Explore my applications and components.",
      },
      {
        title: "Vue Ecosystem",
        icon: "Vuejs",
        link: "https://vue-showcase-8bg.pages.dev/",
        description: "Explore my applications and components.",
      },
    ],
    attr_data: "playground",
  },

  contactSection: {
    title: "Let's Talk",
    description:
      "Ready to start your next project? Send me a message and let's make it happen.",
    info: [
      {
        icon: "mdi:email-outline",
        label: "Email",
        value: "xamperu3@gmail.com",
      },
      {
        icon: "mdi:map-marker-outline",
        label: "Location",
        value: "Lima, Peru",
      },
      {
        icon: "mdi:clock-outline",
        label: "Response Time",
        value: "Within 24 hours",
      },
    ],
    attr_data: "contact",
  },

  navLinks: [
    {
      name: "projects",
      icon: "ri:folder-2-line",
      label: "Projects",
      attr_data: "projects",
    },
    {
      name: "skills",
      icon: "ri:code-s-slash-line",
      label: "Tech",
      attr_data: "skills",
    },
    {
      name: "playground",
      icon: "ri:archive-2-line",
      label: "Playground",
      attr_data: "playground",
    },
    {
      name: "contact",
      icon: "ri:chat-1-line",
      label: "Let's Talk",
      attr_data: "contact",
    },
  ],
};
