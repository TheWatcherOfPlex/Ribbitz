import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    proxy: {
      [process.env.VITE_API_BASE || '/api']: process.env.VITE_DEV_API_TARGET || 'http://localhost:5175',
    },
  },
})
