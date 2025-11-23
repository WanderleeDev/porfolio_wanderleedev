import Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export function getLenisInstance(): Lenis {
  if (!lenisInstance) {
    lenisInstance = new Lenis();
  }

  return lenisInstance;
}

export function destroyLenis() {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}
