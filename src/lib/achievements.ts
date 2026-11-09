import { atom } from "nanostores";

export type AchievementId =
  | "hello-world"
  | "curiosity"
  | "theme-tour"
  | "contact"
  | "chat"
  | "soundtrack";

export interface AchievementDefinition {
  id: AchievementId;
  icon: string;
  title: { es: string; en: string };
  description: { es: string; en: string };
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "hello-world",
    icon: "lucide:sparkles",
    title: { es: "Hello World", en: "Hello World" },
    description: {
      es: "Entraste al portfolio. Todo logro empieza con un primer paso.",
      en: "You entered the portfolio. Every achievement starts with a first step.",
    },
  },
  {
    id: "curiosity",
    icon: "lucide:trophy",
    title: { es: "Curiosidad", en: "Curiosity" },
    description: {
      es: "Abriste la lista de logros. Ahora queda el resto.",
      en: "You opened the achievements list. The rest is up to you.",
    },
  },
  {
    id: "theme-tour",
    icon: "lucide:palette",
    title: { es: "Cambio de piel", en: "Skin Deep" },
    description: {
      es: "Probaste otro tema del sitio.",
      en: "You tried another theme on the site.",
    },
  },
  {
    id: "contact",
    icon: "lucide:send",
    title: { es: "En contacto", en: "In Touch" },
    description: {
      es: "Enviaste un mensaje desde el formulario.",
      en: "You sent a message from the contact form.",
    },
  },
  {
    id: "chat",
    icon: "lucide:message-square",
    title: { es: "Hola, IA", en: "Hello, AI" },
    description: {
      es: "Hiciste tu primera consulta al chat del portfolio.",
      en: "You asked the portfolio chat your first question.",
    },
  },
  {
    id: "soundtrack",
    icon: "lucide:music",
    title: { es: "Banda sonora", en: "Soundtrack" },
    description: {
      es: "Le diste play a un track del reproductor.",
      en: "You pressed play on a player track.",
    },
  },
];

export function achievementTitle(id: AchievementId, lang: "es" | "en"): string {
  const definition = ACHIEVEMENTS.find((achievement) => achievement.id === id);
  return definition ? definition.title[lang] : id;
}

export const ACHIEVEMENTS_STORAGE_KEY = "wdev-logros";

export function readUnlocked(): AchievementId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const known = new Set<string>(ACHIEVEMENTS.map((achievement) => achievement.id));
    return parsed.filter(
      (value): value is AchievementId => typeof value === "string" && known.has(value),
    );
  } catch {
    return [];
  }
}

export const unlocked = atom<AchievementId[]>(readUnlocked());

export function unlock(id: AchievementId): boolean {
  if (typeof window === "undefined") return false;
  const current = unlocked.get();
  if (current.includes(id)) return false;
  const next = [...current, id];
  try {
    window.localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  unlocked.set(next);
  return true;
}
