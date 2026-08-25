import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Le front compilé est déposé dans le dossier public du back : un seul serveur
  // sert l'application et l'API, ce qui supprime le second processus à lancer
  // et rend le CORS inutile (tout est sur la même origine).
  base: '/app/',
  build: {
    outDir: '../api/public/app',
    emptyOutDir: true,
  },

  server: {
    // Développement : ne jamais exposer le serveur Vite sur le réseau.
    host: '127.0.0.1',
  },
})
