/**
 * Logros del portfolio: definiciones y estado persistido en localStorage.
 *
 * Los logros se desbloquean explorando el sitio. El estado vivo del cliente
 * vive en el store `unlocked` (nano store); el HTML se renderiza bloqueado y
 * los suscriptores sincronizan cada card al cambiar el valor.
 */
import { atom } from "nanostores";

export type AchievementId =
  | "hello-world"
  | "theme-tour"
  | "soundtrack"
  | "credits"
  | "chat"
  | "curiosity";

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
    id: "theme-tour",
    icon: "lucide:palette",
    title: { es: "Cambio de piel", en: "Skin Deep" },
    description: {
      es: "Probaste otro tema del sitio.",
      en: "You tried another theme on the site.",
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
  {
    id: "credits",
    icon: "lucide:clapperboard",
    title: { es: "Los que hicieron esto", en: "Credits Roll" },
    description: {
      es: "Abríste los créditos del sitio.",
      en: "You opened the site credits.",
    },
  },
  {
    id: "chat",
    icon: "lucide:message-square",
    title: { es: "Hola, IA", en: "Hello, AI" },
    description: {
      es: "Le escribiste al chat del portfolio.",
      en: "You messaged the portfolio chat.",
    },
  },
  {
    id: "curiosity",
    icon: "lucide:trophy",
    title: { es: "Curiosidad", en: "Curiosity" },
    description: {
      es: "Abríste la lista de logros. Ahora queda el resto.",
      en: "You opened the achievements list. The rest is up to you.",
    },
  },
];

export const ACHIEVEMENTS_STORAGE_KEY = "wdev-logros";

/** Ids desbloqueados, filtrados contra las definiciones actuales. */
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

export function isUnlocked(id: AchievementId): boolean {
  return readUnlocked().includes(id);
}

/**
 * Store de logros desbloqueados. Se inicializa con lo persistido en
 * localStorage; en SSR queda vacío porque `readUnlocked()` ya lo respeta.
 */
export const unlocked = atom<AchievementId[]>(readUnlocked());

/**
 * Llama a `fn` de inmediato con el valor actual y en cada cambio posterior.
 * Es el envoltorio fino sobre el subscribe nativo del nano store.
 */
export function subscribe(fn: (ids: readonly AchievementId[]) => void): () => void {
  return unlocked.subscribe((ids) => fn(ids));
}

/**
 * Marca un logro como desbloqueado. Devuelve true sólo la primera vez, así
 * los llamadores pueden reaccionar sin duplicar notificaciones. Actualiza el
 * store en lugar de despachar el evento antiguo `logros:unlocked`.
 */
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
