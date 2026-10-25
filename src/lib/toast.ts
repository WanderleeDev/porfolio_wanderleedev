/**
 * Toast framework-agnostic: un solo aviso activo a la vez, auto-descartable.
 *
 * No usa dependencias. El contenedor fijo se crea una sola vez en el body.
 * `showToast` muestra el aviso de inmediato si no hay ninguno y, si ya hay uno
 * visible, lo encola para no pisar mensajes que caen en el mismo tick (un
 * logro y su recompensa). El estilo entra (slide + opacidad) y sale con una
 * transición CSS; con prefers-reduced-motion no hay transición.
 */

const DURATION = 3200;

let container: HTMLElement | null = null;
let toast: HTMLElement | null = null;
let timer: number | undefined;
const queue: string[] = [];

const STYLES = `
  [data-toast-container] {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    display: flex;
    justify-content: flex-end;
    pointer-events: none;
  }
  [data-toast] {
    pointer-events: auto;
    max-width: min(22rem, calc(100vw - 3rem));
    padding: .75rem 1.1rem;
    border-radius: 12px;
    border-left: 3px solid rgb(56,189,248);
    background: rgb(15,23,42,.95);
    color: #e2e8f0;
    font-size: .875rem;
    line-height: 1.3;
    box-shadow: 0 8px 24px rgb(0,0,0,.35);
    opacity: 0;
    transform: translateY(8px);
    transition: opacity .25s ease, transform .25s ease;
  }
  [data-toast].toast--visible {
    opacity: 1;
    transform: translateY(0);
  }
  @media (prefers-reduced-motion: reduce) {
    [data-toast] {
      transition: none;
      transform: none;
    }
  }
`;

function ensureToast(): HTMLElement {
  if (toast && toast.isConnected) return toast;
  if (!container || !container.isConnected) {
    const el = document.createElement("div");
    el.setAttribute("data-toast-container", "");
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.body.appendChild(style);
    document.body.appendChild(el);
    container = el;
  }
  const el = document.createElement("div");
  el.setAttribute("data-toast", "");
  el.setAttribute("role", "status");
  container.appendChild(el);
  toast = el;
  return el;
}

function clearTimer() {
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
}

/** Pinta un aviso y reinicia el timer. */
function present(text: string) {
  const el = ensureToast();
  el.textContent = text;

  clearTimer();
  // Reinsertar la clase obliga a recomputar el estilo y dispara de nuevo la
  // transición de entrada cuando el nodo ya existía.
  el.classList.remove("toast--visible");
  void el.offsetWidth;
  el.classList.add("toast--visible");

  timer = window.setTimeout(() => {
    timer = undefined;
    dismissToast();
  }, DURATION);
}

function showNext() {
  const next = queue.shift();
  if (next) present(next);
}

/**
 * Muestra un toast. Si hay uno en pantalla (o desvaneciéndose), el mensaje
 * espera en cola; los duplicados consecutivos se descartan para que un loop
 * no llene la cola.
 */
export function showToast(message: string, icon?: string) {
  const text = icon ? `${icon} ${message}` : message;

  if (toast && toast.isConnected) {
    if (queue[queue.length - 1] !== text) queue.push(text);
    return;
  }
  present(text);
}

/** Cierra el toast activo (si hay) y deja pasar al siguiente en cola. */
export function dismissToast() {
  clearTimer();
  if (!toast || !toast.isConnected) {
    showNext();
    return;
  }
  const el = toast;
  el.classList.remove("toast--visible");
  window.setTimeout(() => {
    el.remove();
    if (toast === el) toast = null;
    if (container && container.hasChildNodes() === false) {
      container.remove();
      container = null;
    }
    showNext();
  }, 260);
}
