import type Lenis from "lenis";
import { $$, $ } from "./selectors";

export function setLenisNavigation(lenisInstance: Lenis): void {
  $$<HTMLAnchorElement>('a[href^="#"]')?.forEach((link) => {
    link.addEventListener("click", (e: Event) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");

      const targetEl = $(targetId ?? "#hero");

      if (targetEl) {
        lenisInstance.scrollTo(targetEl);
      }
    });
  });
}
