import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Escucha en todas las interfaces locales
    cors: true, // Habilita Cross-Origin Resource Sharing
    allowedHosts: [
      'gullible-villain-manhood.ngrok-free.dev',
      '.ngrok-free.dev' // Permite cualquier subdominio de ngrok por si cambia
    ]
  },
  build: {
    sourcemap: false,
  },
  // Usar 'cheap-source-map' para evitar el uso de eval en dev (CSP)
  esbuild: {
    sourcemap: false,
  },
})
