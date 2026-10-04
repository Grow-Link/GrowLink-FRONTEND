# GrowLink — Frontend

> Plataforma que conecta las metas profesionales y financieras de una persona con oportunidades reales — cursos, empleos y servicios — mediante inteligencia artificial.

---

## ¿Qué es GrowLink?

GrowLink es una plataforma web que, a partir del perfil y la meta de un usuario, genera con IA un **roadmap personalizado**, hace **matching de oportunidades** en un marketplace y sugiere **precios justos** a quienes ofrecen un servicio. Antes de ofrecer una habilidad como servicio, los usuarios pueden verificarla compitiendo en **duelos de trivia en tiempo real**.

Tiene tres roles:

- **Usuario regular** — busca crecer profesional y financieramente.
- **Profesor / Proveedor** — ofrece cursos o servicios en el marketplace.
- **Administrador** — gestiona las temáticas habilitadas y ve el dashboard de métricas (acceso separado, no visible desde el flujo normal de usuario).

---

## Funcionalidades principales

| Módulo | Descripción |
|---|---|
| **Registro y perfil** | Registro con selección de rol (Usuario / Proveedor), login, recuperación de contraseña, aceptación de Términos y Condiciones y Política de Privacidad (con modal de lectura). Perfil profesional editable: experiencia laboral, estudios, habilidades en tags, modalidad de trabajo e ingreso mensual |
| **Meta y roadmap con IA** | Definición de meta financiera o profesional. Roadmap con pasos generados por IA, marcado de pasos como completados y aviso para definir una nueva meta al terminar el roadmap. Regeneración manual con IA |
| **Marketplace** | Filtro por categoría y por porcentaje de compatibilidad (sidebar), orden por match/precio/cupos, búsqueda por título o tag. Aviso de nuevos matches, sección de subastas en vivo y CTA para que los proveedores publiquen su oferta |
| **Publicación de oportunidades** | Alta de curso, empleo o servicio con sugerencia de precio por IA y desglose de la comisión de GrowLink |
| **Puja en tiempo real** | Detalle de subasta con oferta más alta, cuenta atrás, feed de pujas y ofertas rápidas |
| **Duelo de trivia** | Crear sala (temática, modo, número de jugadores) o unirse a una existente, sala de espera, modo Kahoot y modo Bloqueo, leaderboard en vivo |
| **Suscripción** | Comparación de plan Gratuito vs. Suscripción Premium (mensual/anual) e historial de pagos |
| **Panel de administración** | Métricas de la plataforma (usuarios activos, % que logra su meta, ingreso promedio, oportunidades activas) con gráficas, y gestión de temáticas habilitadas en el marketplace |
| **Cuenta** | Cambio de contraseña, preferencias de notificación, consulta de Términos aceptados y eliminación de cuenta |

---

## Branding

| | |
|---|---|
| **Nombre** | GrowLink |
| **Colores principales** | `#1E73E8` (azul), `#12C2A8` (teal), `#4CE07E` (verde), `#0B1F3A` (navy) |
| **Tipografías** | Bricolage Grotesque (títulos), Plus Jakarta Sans (texto), JetBrains Mono (datos/mono) |
| **Modo claro / oscuro** | Sí, en toda la app |

---

## Tecnologías

- **React 19** + **TypeScript**
- **Vite 8** — bundler y dev server
- **Tailwind CSS v4** — estilos con `@tailwindcss/vite`
- **React Router v7** — rutas reales por página, con guarda de sesión
- **Recharts** — gráficas del panel de administración
- **oxfmt** — formateo de código

---

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build de producción
npm run preview
```

El servidor de desarrollo corre en `http://localhost:5173` por defecto.

---

## Estructura del proyecto

```
src/
├── components/      # Componentes reutilizables (Navbar, Button, Input, Badge, ProgressBar, LiveIndicator)
├── pages/           # Una vista por página (Auth, Profile, Goal, Roadmap, Marketplace,
│                     #   OpportunityDetail, Auction, TriviaDuel, AdminDashboard, AdminThemes,
│                     #   AccountSettings, PublicProfile, PublishOpportunity, Subscription)
├── store/           # Contextos globales (NavigationContext, ThemeContext)
├── services/        # Datos simulados (mockData) y textos legales (legalText)
├── hooks/           # Hooks propios (useTimer)
├── types/           # Tipos compartidos de dominio
└── imports/         # Imágenes y contenido pegado desde el diseño original
```

---

## Estado actual

La página **Roadmap** ya usa el backend real (cursos-service, ver abajo). El resto de pantallas todavía usan datos simulados en `src/services/mockData.ts` (usuarios, perfil, catálogo, métricas, etc.), así que por ejemplo el resumen del roadmap en Inicio sigue siendo el simulado. La sesión de acceso es únicamente una guarda del lado del cliente (no hay token ni autenticación real todavía), y las funciones de "tiempo real" (pujas, duelos) se simulan con temporizadores en el propio frontend en lugar de WebSockets.

Está pensado para integrarse con una arquitectura de microservicios (Identidad, Perfil y Metas, Roadmap con IA, Marketplace y Pujas, Duelos de Trivia, Monetización, Temáticas y Observabilidad, y un servicio de Tiempo Real transversal) a través de un API Gateway.

---

## Roadmap como grafo (HU-12)

`/roadmap` muestra el roadmap guardado en cursos-service como un grafo dirigido: una columna por **etapa** y una flecha por cada relación de prerequisito real (`A → B` = "A es requisito de B"). La etapa de un curso es la cadena de prerequisitos más larga que tiene dentro de la ruta, así que todo lo de la etapa 1 se puede tomar ya.

- Cada curso muestra su estado: completado, "estás aquí" (el primero disponible según el orden sugerido), disponible, bloqueado o no disponible (dado de baja, HU-10).
- Al pasar el cursor o tocar un curso se resaltan sus prerequisitos (azul) y lo que desbloquea (verde agua). El panel lateral los lista, junto con los prerequisitos reales que quedaron fuera de la ruta por categoría o nivel.
- "Regenerar con IA" llama a `POST /api/roadmap/generar` (HU-11) con el perfil del onboarding.
- Si las etapas no caben, las tarjetas se angostan y, si aún así no caben (celular), el grafo se desliza horizontalmente.

Datos: `GET /api/roadmap/mio`, `GET /api/cursos/completados`, `GET /api/cursos/estado-roadmap` y `GET /api/cursos/{id}` (solo para los prerequisitos externos). Código: `src/utils/roadmapGraph.ts` (grafo y layout, funciones puras), `src/components/PrerequisiteGraph.tsx` y `src/pages/RoadmapPage.tsx`.

**Sesión:** el login del frontend sigue siendo simulado, así que cada usuario simulado se conecta con el usuario de prueba de usuarios-service que tiene su mismo rol (todos los de rol "usuario" ven el roadmap de *Ana (usuario)*). Ver `src/services/backendSession.ts`.

**Conexión:** el navegador solo habla con Vite y Vite reenvía `/api-usuarios` → usuarios-service y `/api-cursos` → cursos-service (`vite.config.ts`), así que no hace falta CORS. Si los servicios no corren en los puertos por defecto, crea un `.env.local` con `USUARIOS_SERVICE_URL=http://localhost:8080` y/o `CURSOS_SERVICE_URL=http://localhost:8086`.

### Cómo probarlo

1. Levanta usuarios-service y cursos-service con el **mismo** secreto (cada uno en su terminal, desde su carpeta):
   ```bash
   export GROWLINK_JWT_SECRET='CHANGE_ME_local_dev_only_not_a_real_secret_32bytes+'
   docker compose up -d && mvn spring-boot:run
   ```
2. Carga datos de prueba (11 cursos con prerequisitos, un roadmap para *Ana (usuario)* y 2 cursos completados). Se puede correr varias veces, reutiliza los cursos que ya existen:
   ```bash
   npm run seed:roadmap
   ```
3. `npm run dev`, abre http://localhost:5173, entra como **Ana Torres** y ve a **Roadmap**.

---

## Despliegue

En desarrollo, Vite hace de proxy hacia los servicios (`/api-usuarios`,
`/api-cursos`, `/api-trivia`, `/ws-trivia`, ver `vite.config.ts`). Ese proxy no
existe en produccion, asi que ahi lo hace nginx: el `Dockerfile` compila el
front y lo sirve con nginx, que ademas es la entrada unica hacia los tres
servicios (`deploy/nginx.conf.template`).

- Los servicios se resuelven por nombre en cada peticion, asi que si hay
  varias replicas de un servicio detras del mismo nombre, nginx reparte la
  carga entre ellas.
- Se configura con variables de entorno del contenedor:

| Variable | Valor por defecto | Para que sirve |
|---|---|---|
| `USUARIOS_URL` | `http://usuarios-service:8080` | Donde esta usuarios-service |
| `CURSOS_URL` | `http://cursos-service:8086` | Donde esta cursos-service |
| `TRIVIA_URL` | `http://trivia-service:8085` | Donde esta trivia-service |
| `DNS_RESOLVER` | `127.0.0.11` | DNS de Docker. En Azure App Service va `168.63.129.16` |

- Panel del admin: la seccion "Concurrencia en tiempo real" muestra datos reales
  de `GET /api/metricas/dashboard` de trivia-service (salas activas, jugadores
  conectados, latencia a la primera respuesta, empates resueltos), se actualiza
  cada 5 segundos. Las demas graficas de esa pagina siguen siendo de ejemplo.
- En el Home, "Tu perfil" muestra las trivias ganadas que suma trivia-service.
- `ci.yml` revisa los tipos y compila en cada push a `main`, `avance` o `final`.
- `cd.yml` construye la imagen, la sube a GitHub Container Registry y la
  despliega a Azure App Service en el ambiente de su rama (`main` -> `actual`,
  `avance` -> `avance`, `final` -> `final`). En la App Service poner
  `WEBSITES_PORT=80` y las variables de arriba. El flujo completo de ramas y
  ambientes esta en el README del repo `infra`.

---

## Institución

**Escuela Colombiana de Ingeniería Julio Garavito**
Proyecto académico — Arquitecturas de Software (ARSW) · 2026
