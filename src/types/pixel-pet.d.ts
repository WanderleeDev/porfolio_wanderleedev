import type { PixelPet } from "@wanderleedev/pixel-pet";
import type { HTMLAttributes } from "react";

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "pixel-pet": HTMLAttributes<HTMLElement> & {
                src?: string;
                lang?: string;
                scale?: number | string;
                speed?: number | string;
                "sleep-after"?: number | string;
                "force-motion"?: boolean | string;
            };
        }
    }
}

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
