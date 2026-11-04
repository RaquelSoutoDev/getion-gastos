/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Configuración completa (manifest, iconos, estrategia de caché offline) en la Fase 4.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
    }),
  ],
  test: {
    environment: 'node',
  },
})
