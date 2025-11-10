export interface Section {
    name: string;
    index: number;
    images: string[];
    backgroundColor: string;
}

export const sections: Section[][]= [
  [
    {
      name: "projects",
      index: 1,
      images: [
        "https://framerusercontent.com/images/qdGm6GFKIwaVKa8I3ncq7hr6Os.webp",
        "https://framerusercontent.com/images/2OlQ1mQD4UckZ3DKYPRxiiwGA0.webp",
        "https://framerusercontent.com/images/UzM1roycI6mIJ8sdUXkPdngUfc.webp",
      ],
      backgroundColor: "bg-folder-1",
    },
    {
      name: "stack",
      index: 2,
      images: [
        "https://framerusercontent.com/images/qdGm6GFKIwaVKa8I3ncq7hr6Os.webp",
        "https://framerusercontent.com/images/2OlQ1mQD4UckZ3DKYPRxiiwGA0.webp",
        "https://framerusercontent.com/images/UzM1roycI6mIJ8sdUXkPdngUfc.webp",
      ],
      backgroundColor: "bg-folder-2",
    }
  ],
  [
    {
      name: "extras",
      index: 3,
      images: [
        "https://framerusercontent.com/images/qdGm6GFKIwaVKa8I3ncq7hr6Os.webp",
        "https://framerusercontent.com/images/2OlQ1mQD4UckZ3DKYPRxiiwGA0.webp",
        "https://framerusercontent.com/images/UzM1roycI6mIJ8sdUXkPdngUfc.webp",
      ],
      backgroundColor: "bg-folder-3",
    },
    {
      name: "contact",
      index: 4,
      images: [
        "https://framerusercontent.com/images/qdGm6GFKIwaVKa8I3ncq7hr6Os.webp",
        "https://framerusercontent.com/images/2OlQ1mQD4UckZ3DKYPRxiiwGA0.webp",
        "https://framerusercontent.com/images/UzM1roycI6mIJ8sdUXkPdngUfc.webp",
      ],
      backgroundColor: "bg-folder-1",
    },
  ]
];

export const skills = [
          // Mi Stack MEAN - Primero por ser el más importante
          {
            title: "Mi Stack (MEAN)",
            techs: [
              { color: "#13AA52", icon: "devicon:mongodb" },
              { color: "#9e9e9e", icon: "devicon:express" },
              { color: "#DD0031", icon: "devicon:angular" },
              { color: "#339933", icon: "devicon:nodejs" },
            ],
          },

          // Sección Frontend
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
              { color: "#F05032", icon: "devicon:git" },
              { color: "#9e9e9e", icon: "devicon:github" },
              { color: "#d2227d", icon: "devicon:ngrx" },
            ],
          },
                    {
            title: "Backend",
            techs: [
              { color: "#ffc331", icon: "devicon:python" },
              { color: "#009688", icon: "devicon:fastapi" },
            ],
          },
          {
            title: "Usado Ocasionalmente",
            techs: [
              { color: "#42b883", icon: "devicon:vuejs" },
              { color: "#00DC82", icon: "devicon:nuxtjs" },
              { color: "#8C38EF", icon: "devicon:bootstrap" },
            ],
          }
    ]

    export const main_projects = [
      {
        title: "Ecommerce",
        description:
          "Ecommerce con sistema de autenticación, carrito de compras, notificación y uso de local Storage",
          demo_url: "https://clior.vercel.app/",
        technologies: ["angular", "sass", "typeScript", "flowbite"],
        image: "clior.webp",
        label: "ver demo ecommerce",
      },
      {
        title: "Ubuntu desktop",
        description:
          "Copia funcional del escritorio de ubuntu 22.0.4, calendario, terminal, editor de código entre otros",
          demo_url: "https://github.com/",
        technologies: ["angular", "tailwindCss", "typeScript", "ngrx"],
        image: "ubuntu.webp",
        label: "ver demo ubuntu",
      },
      {
        title: "Retro Blog",
        description:
          "Desarrollado con la librería CSS Nes, cuenta con pequeños blogs de contenido estático y uso las features Scroll Animations de Css",
          demo_url: "https://retro-blog-two.vercel.app/",
        technologies: ["astro", "css", "typeScript"],
        image: "retro_blog.webp",
        label: "ver demo retro blog",
      },
      {
        title: "Switch 2 Clone",
        description:
          "Desarrollado utilizando medidas de viewport para lograr un diseño responsivo a mayor escala",
          demo_url: "https://dainty-pika-231bcd.netlify.app/",
        technologies: ["vue", "tailwindCss", "typeScript"],
        image: "nintendo_shots.webp",
        label: "ver demo switch 2 clone",
      },
    ];

    export const extra_projects = [
      {
        title: "Proyectos Angular",
        icon: "Angular",
        description: "Algunos de mis proyectos realizados con Angular.",
        link: "https://entry-page-angular.vercel.app/",
      },
      {
        title: "Proyectos React",
        icon: "React",
        link: "https://react-showcase-three.vercel.app/",
        description: "Algunos de mis proyectos realizados con React y Nextjs.",
      },
      {
        title: "Proyectos Vue",
        icon: "Vuejs",
        link: "https://vue-showcase-8bg.pages.dev/",
        description: "Algunos de mis proyectos realizados con Vue.",
      },
    ];