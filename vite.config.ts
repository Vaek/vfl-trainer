import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path matches GitHub Pages URL: https://vaek.github.io/vfl-trainer/
  base: '/vfl-trainer/',
})
