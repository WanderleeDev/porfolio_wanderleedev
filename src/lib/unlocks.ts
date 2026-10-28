import { computed } from "nanostores";
import { progress } from "./logros-store";

const MINIMAP_AT = 2;
const VERTICAL_AT = 4;
export const CREDITS_AT = 6;

export const minimapUnlocked = computed(progress, (count) => count >= MINIMAP_AT);
export const verticalUnlocked = computed(progress, (count) => count >= VERTICAL_AT);
export const creditsUnlocked = computed(progress, (count) => count >= CREDITS_AT);
