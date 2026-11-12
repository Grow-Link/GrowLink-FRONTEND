/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Configuración aparte de vite.config.ts a propósito: ahí vive la app (plugins de React, Tailwind y el proxy
// a los microservicios) y nada de eso hace falta para correr las pruebas, que son de lógica en TypeScript.
//
//   npm test            una pasada de todas las pruebas
//   npm run test:coverage   lo mismo, con el reporte de cobertura (texto en consola, y en coverage/ el
//                           lcov.info que lee SonarCloud y el HTML en coverage/lcov-report/)
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
      // La cobertura se mide sobre la lógica: todo src/ menos la presentación. Las páginas, los componentes y el
      // arranque de React (App.tsx, main.tsx) quedan fuera porque son presentación (y así lo pide el alcance), y
      // con ellos se van tres módulos que tampoco son lógica:
      //   roadmapPdf  dibuja el PDF con jsPDF (coordenadas y tipografías, se revisa mirándolo)
      //   sonidos     sintetiza los efectos con la Web Audio API
      //   legalText   dos textos legales en constantes; probarlos sería comprobar que existen
      // store/ y hooks/ SÍ cuentan: NavigationContext decide la sesión y a qué pantalla va cada rol, y eso es
      // lógica aunque viva en un componente de React.
      //
      // ESTA LISTA ES LA MISMA que sonar.coverage.exclusions en sonar-project.properties: si se cambia una, se
      // cambia la otra, para que el número de aquí y el de SonarCloud sean el mismo. Una carpeta nueva en src/
      // cuenta en los dos sin tocar nada.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/pages/**',
        'src/components/**',
        'src/App.tsx',
        'src/main.tsx',
        'src/utils/roadmapPdf.ts',
        'src/utils/sonidos.ts',
        'src/services/legalText.ts',
        'src/**/*.d.ts',
        // las pruebas y lo que las ayuda no son código a cubrir (en SonarCloud son sonar.tests)
        'src/**/*.test.ts',
        'src/pruebas/**',
      ],
    },
  },
});
