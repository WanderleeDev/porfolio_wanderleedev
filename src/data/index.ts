export interface Section {
  name: string;
  index: number;
  images: string[];
  backgroundColor: string;
}

export const skills = [
  {
    title: "My Stack",
    techs: [
      { color: "#13AA52", icon: "devicon:mongodb" },
      { color: "#9e9e9e", icon: "devicon:express" },
      { color: "#DD0031", icon: "devicon:angular" },
      { color: "#339933", icon: "devicon:nodejs" },
    ],
  },

  // Frontend Section
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
    title: "",
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
];

export const main_projects = [
  {
    title: "Ecommerce",
    description:
      "Ecommerce with authentication system, shopping cart, notifications, and local storage usage",
    demo_url: "https://clior.vercel.app/",
    technologies: ["angular", "sass", "typeScript", "flowbite"],
    image: "clior.webp",
    label: "view ecommerce demo",
  },
  {
    title: "Ubuntu desktop",
    description:
      "Functional copy of Ubuntu 22.0.4 desktop, calendar, terminal, code editor among others",
    demo_url: "https://github.com/",
    technologies: ["angular", "tailwindCss", "typeScript", "ngrx"],
    image: "ubuntu.webp",
    label: "view ubuntu demo",
  },
  {
    title: "Retro Blog",
    description:
      "Developed with Nes CSS library, features small static content blogs and uses CSS Scroll Animations",
    demo_url: "https://retro-blog-two.vercel.app/",
    technologies: ["astro", "css", "typeScript"],
    image: "retro_blog.webp",
    label: "view retro blog demo",
  },
  {
    title: "Switch 2 Clone",
    description:
      "Developed using viewport units to achieve a responsive design on a larger scale",
    demo_url: "https://dainty-pika-231bcd.netlify.app/",
    technologies: ["vue", "tailwindCss", "typeScript"],
    image: "nintendo_shots.webp",
    label: "view switch 2 clone demo",
  },
];

export const extra_projects = [
  {
    title: "Angular Projects",
    icon: "Angular",
    description: "Some of my projects made with Angular.",
    link: "https://entry-page-angular.vercel.app/",
  },
  {
    title: "React Projects",
    icon: "React",
    link: "https://react-showcase-three.vercel.app/",
    description: "Some of my projects made with React and Nextjs.",
  },
  {
    title: "Vue Projects",
    icon: "Vuejs",
    link: "https://vue-showcase-8bg.pages.dev/",
    description: "Some of my projects made with Vue.",
  },
];

export const sections_links = [
  {
    name: "home",
    icon: "ri:home-2-line",
    label: "Home",
  },
  {
    name: "skills",
    icon: "ri:code-s-slash-line",
    label: "Skills",
  },
  {
    name: "projects",
    icon: "ri:folder-2-line",
    label: "Projects",
  },
  {
    name: "contact",
    icon: "ri:mail-line",
    label: "Contact",
  },
  {
    name: "extras",
    icon: "ri:archive-2-line",
    label: "Extras",
  },
];
