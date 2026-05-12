import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Same-origin `/api/venice/*` → upstream (no browser CORS in dev).
      '/api/venice': {
        target: 'https://taskboard.krakost1980.workers.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
