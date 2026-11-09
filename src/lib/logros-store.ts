import { atom, computed } from "nanostores";
import { achievementTitle, unlocked, type AchievementId, unlock } from "./achievements";
import { showToast } from "./toast";

export const progress = computed(unlocked, (ids) => new Set(ids).size);

export const isOpen = atom(false);

function activeLang(): "es" | "en" {
  return typeof document !== "undefined" && document.documentElement.lang.startsWith("en")
    ? "en"
    : "es";
}

export function toggleLogros() {
  isOpen.set(!isOpen.get());
}

export function requestUnlock(id: AchievementId): boolean {
  const fresh = unlock(id);
  if (fresh) {
    const lang = activeLang();
    const prefix = lang === "en" ? "Achievement unlocked" : "Logro desbloqueado";
    showToast(`${prefix}: ${achievementTitle(id, lang)}`);
  }
  return fresh;
}

export function mount(open: () => void, close: () => void): () => void {
  let first = true;
  return isOpen.subscribe((openNow) => {
    if (first) {
      first = false;
      return;
    }
    if (openNow) open();
    else close();
  });
}
