// @ts-check
import { defineConfig, fontProviders, envField } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: ["100 900"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Fira Sans Extra Condensed",
      cssVariable: "--font-fira",
      weights: [700, 900],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  image: {
    domains: ["res.cloudinary.com"],
  },

  integrations: [react()],
  output: "server",
  adapter: node({ mode: "standalone" }),
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  server: {
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "clan-lace-discounts-steps.trycloudflare.com",
    ],
  },
 env: {
    schema: {
      // Resend
      RESEND_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      CONTACT_TO_EMAIL: envField.string({
        context: "server",
        access: "secret",
      }),
      CONTACT_FROM_EMAIL: envField.string({
        context: "server",
        access: "secret",
      }),
      RESEND_TEMPLATE_ID: envField.string({
        context: "server",
        access: "secret",
      }),
      RESEND_TEMPLATE_ID_EN: envField.string({
        context: "server",
        access: "secret",
      }),

      // GEMINI API
      GEMINI_API_KEY: envField.string({
        context: "server",
        access: "secret"
      }),

      // LLM (API compatible con OpenAI)
      LLM_BASE_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      LLM_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      LLM_MODEL: envField.string({
        context: "server",
        access: "public",
      }),
      LLM_EMBEDDING_MODEL: envField.string({
        context: "server",
        access: "public",
      }),
      LLM_EMBEDDING_DIMENSIONS: envField.number({
        context: "server",
        access: "public",
        int: true,
        min: 1,
      }),

      // Qdrant
      QDRANT_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      QDRANT_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      QDRANT_COLLECTION: envField.string({
        context: "server",
        access: "public",
      }),
      RAG_MIN_SCORE: envField.number({
        context: "server",
        access: "public",
        min: 0,
        max: 1,
        default: 0.3,
      }),
    },
    validateSecrets: true,
  },
});
