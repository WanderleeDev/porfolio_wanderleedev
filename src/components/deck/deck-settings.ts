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
  minimap: boolean;
  /** Flechas flotantes de navegación (prev/next/up/down). */
  arrows: boolean;
  /** El usuario tocó el switch: su valor manda sobre el desbloqueo automático. */
  lockTouched: boolean;
  minimapTouched: boolean;
}

const KEY = "wdev-deck";

const DEFAULTS: DeckSettings = {
  lock: true,
  minimap: false,
  arrows: true,
  lockTouched: false,
  minimapTouched: false,
};

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readStored(): DeckSettings {
  try {
    if (typeof localStorage === "undefined") return { ...DEFAULTS };
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      lock: flag(parsed.lock, DEFAULTS.lock),
      minimap: flag(parsed.minimap, DEFAULTS.minimap),
      arrows: flag(parsed.arrows, DEFAULTS.arrows),
      lockTouched: flag(parsed.lockTouched, DEFAULTS.lockTouched),
      minimapTouched: flag(parsed.minimapTouched, DEFAULTS.minimapTouched),
    };
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
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* cuota, modo privado o storage bloqueado */
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
