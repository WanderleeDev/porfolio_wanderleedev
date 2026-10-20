import type { PixelPet } from "@wanderleedev/pixel-pet";

declare global {
    interface HTMLElementTagNameMap {
        "pixel-pet": PixelPet;
    }

    namespace AstroHTML.JSX {
        interface IntrinsicElements {
            "pixel-pet": {
                src?: string;
                lang?: string;
                scale?: number | string;
                speed?: number | string;
                "sleep-after"?: number | string;
                "force-motion"?: boolean | string;
                class?: string;
            };
        }
    }
}

export {};
