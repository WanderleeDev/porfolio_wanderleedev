import { Stack } from "../types/physics";

export const stacks: Stack[] = [
  {
    id: "fullstack",
    title: "🚀 Full Stack",
    gradient: "bg-gradient-to-br from-purple-900 via-purple-700 to-purple-900",
    items: [
      { id: 1, text: "React", color: "#61DAFB", icon: "⚛️" },
      { id: 2, text: "TypeScript", color: "#3178C6", icon: "📘" },
      { id: 3, text: "Node.js", color: "#339933", icon: "🟢" },
      { id: 4, text: "MongoDB", color: "#47A248", icon: "🍃" },
      { id: 5, text: "Docker", color: "#2496ED", icon: "🐳" },
    ],
  },
  {
    id: "frontend",
    title: "🎨 Frontend",
    gradient: "bg-gradient-to-br from-cyan-900 via-cyan-700 to-cyan-900",
    items: [
      { id: 6, text: "React", color: "#61DAFB", icon: "⚛️" },
      { id: 7, text: "Vue", color: "#4FC08D", icon: "💚" },
      { id: 8, text: "Tailwind", color: "#06B6D4", icon: "🎨" },
      { id: 9, text: "Next.js", color: "#000000", icon: "▲" },
      { id: 10, text: "CSS", color: "#1572B6", icon: "🎭" },
    ],
  },
  {
    id: "backend",
    title: "⚙️ Backend",
    gradient: "bg-gradient-to-br from-green-900 via-green-700 to-green-900",
    items: [
      { id: 11, text: "Node.js", color: "#339933", icon: "🟢" },
      { id: 12, text: "Python", color: "#3776AB", icon: "🐍" },
      { id: 13, text: "PostgreSQL", color: "#336791", icon: "🐘" },
      { id: 14, text: "Redis", color: "#DC382D", icon: "⚡" },
      { id: 15, text: "Express", color: "#000000", icon: "🚂" },
    ],
  },
];

