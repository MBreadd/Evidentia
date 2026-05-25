import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Compatible con variables del proyecto Evidentia (NEXT_PUBLIC_*) y Vite (VITE_*)
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    react(),
    tailwindcss()
  ],
build: {
  chunkSizeWarningLimit: 1000,
},
})