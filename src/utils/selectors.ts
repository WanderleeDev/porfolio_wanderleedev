export function $<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector(selector);
}

export function $$<T extends HTMLElement>(
  selector: string
): NodeListOf<T> | null {
  return document.querySelectorAll(selector);
}
