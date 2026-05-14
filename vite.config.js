import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
  // Usar 'cheap-source-map' para evitar el uso de eval en dev (CSP)
  esbuild: {
    sourcemap: false,
  },
})
