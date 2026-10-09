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
├── services/        # Clientes de los servicios (cursos, usuarios, trivia, roadmap) y textos legales
├── hooks/           # Hooks propios (useTimer)
├── types/           # Tipos compartidos de dominio
└── imports/         # Imágenes y contenido pegado desde el diseño original
```

---

## Estado actual

Todo lo que se ve sale de los servicios reales (usuarios-service, cursos-service y trivia-service): ya no hay datos simulados en el catálogo, el roadmap, los exámenes, el perfil, las métricas ni la trivia. La única ilustración fija es el mapa de ejemplo de la página de inicio (landing), que es decorativo.

El login elige a una persona de prueba (`GET /api/auth/usuarios`) y guarda su token; cada llamada va con ese token por el proxy de Vite.

## Cómo está armado el recorrido de una persona

1. **Onboarding guiado** (`/perfil/completar`): primero se muestran las áreas que tienen cursos *hoy* (`GET /api/cursos/resumen`, con número de cursos, horas y ejemplos), luego se pide la meta (con ideas sacadas del catálogo) y por último el punto de partida, redactado en relación con esa meta. Si la meta no tiene sentido o no hay cursos para ella, el servidor la rechaza (400/422) y la pantalla lo explica; no se guarda nada ni se inventa una ruta.
2. **Roadmap** (`/roadmap`): un mapa por etapas (Cimientos → Construcción → Especialización → Dominio) en vez de una línea recta. Al tocar un curso se abre su panel: por qué está en la ruta, descripción, temario, habilidades, prerrequisitos, **enlace para estudiarlo**, botón para **presentar el examen ahí mismo** y otras opciones equivalentes. El curso completado cambia de color y el avance (%, horas, habilidades) se actualiza. Si un curso se da de baja, se avisa y deja de recomendarse al actualizar.
3. **Catálogo** (`/cursos`): búsqueda y filtros a la izquierda (área, nivel, duración, habilidad, con examen, solo mi roadmap), tarjetas a la derecha. Cada tarjeta lleva a la ficha del curso; **no hay botón de "marcar como completado"**: un curso solo se completa aprobando su examen (70%), que califica el servidor.
4. **PDF** (botón *Descargar PDF* en el roadmap): documento propio, no una foto. Portada con la meta y el avance, mapa de la ruta (cada parada salta a la ficha del curso dentro del PDF) y una ficha por curso con descripción, horas, temario, habilidades, prerrequisitos y enlaces clicables. En celulares que lo permiten aparece también *Compartir*.
5. **Trivia** (`/trivia`): crear sala o unirse con código, **retar a alguien** (búsqueda de personas, «te reto a una trivia», aviso con campana y sonido en la persona retada), sonidos, rachas, felicitaciones y confeti, y al final el podio con el detalle de la competencia. La pestaña *Ganadores* muestra el salón de la fama y el historial de partidas.

El color principal es un verde azulado sereno con acentos cálidos (ámbar y coral para lo importante); el azul se evitó a propósito porque cansa la vista.

## Navegación

Cada rol tiene su inicio (usuario → Inicio, publicador → Mis cursos, admin → Métricas) y solo ve sus pantallas. Los **roadmaps son para quienes aprenden**: el publicador gestiona cursos y preguntas de trivia (y puede jugar), el admin modera y mira métricas. El botón «atrás» del navegador no puede llevar a pantallas de una sesión anterior: cada inicio de sesión marca el historial y las entradas de otra sesión se reemplazan por el inicio del rol.

## Conexión

El navegador solo habla con Vite y Vite reenvía `/api-usuarios` → usuarios-service, `/api-cursos` → cursos-service, `/api-trivia` → trivia-service y `/ws-trivia` → el WebSocket (`vite.config.ts`), así que no hace falta CORS. Si los servicios no corren en los puertos por defecto, crea un `.env.local` con `USUARIOS_SERVICE_URL`, `CURSOS_SERVICE_URL` y/o `TRIVIA_SERVICE_URL`.

### Cómo probarlo

La forma más rápida es `infra/scripts/demo-sin-docker.ps1` (levanta todo con bases en memoria). Entra como **Ana Torres** para hacer el recorrido completo desde cero, o como **Esteban Londoño**, que ya trae un roadmap con 3 cursos aprobados para ver el avance.

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
