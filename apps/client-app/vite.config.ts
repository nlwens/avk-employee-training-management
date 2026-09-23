import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    // Base: React and TailwindCSS
    tailwindcss(),
    react(),

    // Configure PWA
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],

      manifest: {
        // Manifest localization is supported only in Chromium 148+.
        name_localized: {
          en: "AVK Safety Training",
        },
        short_name_localized: {
          en: "AVK Training",
        },
        description_localized: {
          en: "Security training for employees at AVK Vaassen",
        },

        name: "AVK Veiligheidstraining",
        short_name: "AVK Training",
        description: "Veiligheidstraining voor medewerkers bij AVK Vaassen",

        lang: "nl",
        theme_color: "#002395",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",

        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        // Precache the entire app shell so it loads offline without a network
        // round-trip. Content-hashed filenames make cache invalidation automatic.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,otf}"],

        cleanupOutdatedCaches: true,
      },
    }),
  ],

  resolve: {
    alias: {
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@api": path.resolve(__dirname, "../../packages/api"),
      "@auth-context": path.resolve(__dirname, "../../packages/auth-context"),
    },
  },

  preview: {
    allowedHosts: [
      // Tunneling to localhost: https://pinggy.io/
      ".pinggy.link",
    ],
  },
});
