import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Modo "telefono" (npm run dev:telefono): HTTPS con certificado local para probar
// la cámara desde un celular en la misma red (getUserMedia exige conexión segura).
export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === "telefono" ? [basicSsl()] : []),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      // El registro lo hace src/pwa.ts (para conectar el aviso de actualización).
      injectRegister: false,
      // APP-D-10: la API de Supabase NUNCA se guarda en caché (el saldo siempre es el
      // del servidor en ese momento). Solo se precachea el cascarón de la app.
      workbox: {
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//],
        runtimeCaching: [{ urlPattern: /^https:\/\/[^/]+\.supabase\.co\//, handler: "NetworkOnly" }],
      },
      manifest: {
        name: "PrintFlow — Entregas",
        short_name: "PrintFlow",
        description: "PWA para instaladores de Imprenta Escalante",
        display: "standalone",
        orientation: "portrait",
        background_color: "#101010",
        theme_color: "#F89A16",
        icons: [
          {
            src: "/manifest-icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/manifest-icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    css: true,
  },
}));
