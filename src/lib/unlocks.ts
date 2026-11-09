import { computed } from "nanostores";
import { progress } from "./logros-store";

const MINIMAP_AT = 2;
const VERTICAL_AT = 4;
export const minimapUnlocked = computed(progress, (count) => count >= MINIMAP_AT);
export const verticalUnlocked = computed(progress, (count) => count >= VERTICAL_AT);
