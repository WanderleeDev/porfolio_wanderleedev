export function $<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector(selector);
}
