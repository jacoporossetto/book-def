import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import vercel from 'vite-plugin-vercel'

export default defineConfig({
  plugins: [
    react(),
    vercel()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'booksnap.it',
      'localhost',
      '127.0.0.1',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  vercel: {}
})