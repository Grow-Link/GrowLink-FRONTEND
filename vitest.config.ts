/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Configuración aparte de vite.config.ts a propósito: ahí vive la app (plugins de React, Tailwind y el proxy
// a los microservicios) y nada de eso hace falta para correr las pruebas, que son de lógica en TypeScript.
//
//   npm test            una pasada de todas las pruebas
//   npm run test:coverage   lo mismo, con el reporte de cobertura (texto en consola y lcov en coverage/)
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    // jsdom porque la capa de servicios usa cosas del navegador de verdad: sessionStorage y localStorage para
    // la sesión, window.dispatchEvent para avisar que el token venció, y Headers/Response para los fetch.
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/pruebas/setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      // La cobertura se mide sobre la lógica, que es lo que se prueba: los servicios y las utilidades. Las
      // páginas y los componentes quedan fuera porque son presentación (y así lo pide el alcance), y con
      // ellos se van tres módulos que tampoco son lógica:
      //   roadmapPdf  dibuja el PDF con jsPDF (coordenadas y tipografías, se revisa mirándolo)
      //   sonidos     sintetiza los efectos con la Web Audio API
      //   legalText   dos textos legales en constantes; probarlos sería comprobar que existen
      include: ['src/services/**/*.ts', 'src/utils/**/*.ts'],
      exclude: ['src/utils/roadmapPdf.ts', 'src/utils/sonidos.ts', 'src/services/legalText.ts', 'src/**/*.test.ts'],
    },
  },
});
