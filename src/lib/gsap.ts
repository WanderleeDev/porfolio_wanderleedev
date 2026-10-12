/**
 * Punto único de verdad para los plugins de GSAP.
 * registerPlugin es idempotente: importar este módulo garantiza
 * que los plugins estén registrados en el chunk del componente.
 */
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(Draggable, InertiaPlugin, ScrollTrigger);

export { gsap, Draggable, InertiaPlugin, ScrollTrigger };
