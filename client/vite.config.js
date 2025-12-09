import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:5051',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:5051',
        changeOrigin: true,
        secure: false
      },
      '/gallery': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:5051',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
