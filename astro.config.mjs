// @ts-check
import { defineConfig, fontProviders } from "astro/config";
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
  output: "static",
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
});
