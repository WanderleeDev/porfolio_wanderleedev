/**
 * Ajustes del deck respaldados por un nano store `map`.
 *
 * El estado vivo vive en la clave `settings`; `loadSettings`/`saveSettings`/
 * `updateSetting` mantienen la misma firma y el mismo comportamiento con
 * localStorage, pero ya no despachan el CustomEvent `deck:settings`. Los
 * suscriptores usan `subscribeSettings` (llamada inmediata + cada cambio).
 */
import { map } from "nanostores";

export interface DeckSettings {
  lock: boolean;
  overview: boolean;
  minimap: boolean;
  /** Flechas flotantes de navegación (prev/next/up/down). */
  arrows: boolean;
}

const KEY = "wdev-deck";

const DEFAULTS: DeckSettings = { lock: true, overview: true, minimap: false, arrows: true };

function readStored(): DeckSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<DeckSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * Store de ajustes del deck: un mapa `settings` inicializado con lo
 * persistido. Se actualiza completo para conservar el comportamiento
 * original (una sola fuente por guardado).
 */
export const settings = map<DeckSettings>(readStored());

export function loadSettings(): DeckSettings {
  return { ...settings.get() };
}

export function saveSettings(s: DeckSettings) {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore quota / private mode */
    }
  }
  settings.set({ ...s });
}

export function updateSetting<K extends keyof DeckSettings>(key: K, value: DeckSettings[K]) {
  saveSettings({ ...loadSettings(), [key]: value });
}

export function onSettings(fn: (s: DeckSettings) => void) {
  return settings.subscribe(fn);
}

/** Suscripción inmediata + cada cambio: firma estable para los llamadores. */
export function subscribeSettings(fn: (s: DeckSettings) => void): () => void {
  return settings.subscribe(fn);
}
