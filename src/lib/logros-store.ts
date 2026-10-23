/**
 * Estado central del overlay de logros.
 *
 * `isOpen` es la única fuente de verdad del estado abierto/cerrado;
 * `toggleLogros` es el único punto de entrada desde la UI y lo invierte.
 * `requestUnlock` avanza el logro y muestra un toast si es la primera vez.
 * `mount` conecta el store al diálogo: el panel conserva su coreografía de
 * GSAP, aquí solo vive el disparador.
 */
import { atom, computed } from "nanostores";
import { ACHIEVEMENTS, unlocked, type AchievementId, unlock } from "./achievements";
import { showToast } from "./toast";

/** Re-export del store de logros desbloqueados y su progreso total. */
export { unlocked };
export const progress = computed(unlocked, (ids) => new Set(ids).size);

/** Abierto o cerrado el overlay de logros. */
export const isOpen = atom(false);

function achievementTitle(id: AchievementId): string {
  const definition = ACHIEVEMENTS.find((a) => a.id === id);
  return definition ? definition.title.es : id;
}

/**
 * Togglea el overlay de logros. Lo llaman el disparador de ThemePicker, el
 * botón X del overlay y el "cancel" de Escape: así el store no pierde el
 * hilo del estado abierto/cerrado por ningún camino de cierre.
 */
export function toggleLogros() {
  isOpen.set(!isOpen.get());
}

/**
 * Intenta desbloquear un logro; si es la primera vez muestra un toast con el
 * título del logro. Devuelve si fue nuevo, igual que `unlock`.
 */
export function requestUnlock(id: AchievementId): boolean {
  const fresh = unlock(id);
  if (fresh) {
    showToast(`Logro desbloqueado: ${achievementTitle(id)}`);
  }
  return fresh;
}

/**
 * Conecta el store al diálogo de logros. El panel sigue manejando su
 * timeline; `open`/`close` son las funciones que ya existen en el overlay.
 * La primera notificación del subscribe (estado inicial, siempre false) se
 * descarta: el diálogo nace cerrado.
 */
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
