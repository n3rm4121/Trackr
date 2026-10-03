// vite.config.ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),

    react(),
    // ...,
  ],
  resolve: {
    // Mirrors the `@/*` paths in tsconfig, which TypeScript and Vite each need
    // to be told about separately.
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  server: {
    // Local dev runs the web app (:5173) and the API (:3000) on different
    // ports, so /api calls are proxied to Express. In production both share
    // one domain and Vercel routes /api/* to the api service instead.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
