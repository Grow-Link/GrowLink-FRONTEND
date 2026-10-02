import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Sin prefijo VITE_: solo los usa el servidor de desarrollo, no llegan al navegador.
  const env = loadEnv(mode, process.cwd(), '')

  // El navegador solo habla con Vite (/api-usuarios, /api-cursos) y Vite reenvía
  // a cada microservicio. Así no hace falta configurar CORS en los backends.
  const proxyTo = (target: string, prefix: string) => ({
    target,
    changeOrigin: true,
    rewrite: (p: string) => p.replace(new RegExp(`^${prefix}`), ''),
  })

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api-usuarios': proxyTo(env.USUARIOS_SERVICE_URL ?? 'http://localhost:8080', '/api-usuarios'),
        '/api-cursos': proxyTo(env.CURSOS_SERVICE_URL ?? 'http://localhost:8086', '/api-cursos'),
        '/api-trivia': proxyTo(env.TRIVIA_SERVICE_URL ?? 'http://localhost:8085', '/api-trivia'),
        // STOMP nativo sobre WS (sin SockJS) — mismo truco de proxy que los fetch, pero con upgrade de websocket.
        '/ws-trivia': {
          target: env.TRIVIA_SERVICE_URL ?? 'http://localhost:8085',
          ws: true,
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/ws-trivia/, '/ws'),
        },
      },
    },
  }
})
