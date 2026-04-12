import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project site: https://jdcb4.github.io/BracketFactory/
export default defineConfig({
  base: '/BracketFactory/',
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
