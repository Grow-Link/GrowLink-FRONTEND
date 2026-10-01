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

Este frontend todavía **no está conectado a ningún backend real** — todos los datos (usuarios, oportunidades, roadmap, métricas, etc.) son simulados en `src/services/mockData.ts`. La sesión de acceso es únicamente una guarda del lado del cliente (no hay token ni autenticación real todavía), y las funciones de "tiempo real" (pujas, duelos) se simulan con temporizadores en el propio frontend en lugar de WebSockets.

Está pensado para integrarse con una arquitectura de microservicios (Identidad, Perfil y Metas, Roadmap con IA, Marketplace y Pujas, Duelos de Trivia, Monetización, Temáticas y Observabilidad, y un servicio de Tiempo Real transversal) a través de un API Gateway.

---

## Institución

**Escuela Colombiana de Ingeniería Julio Garavito**
Proyecto académico — Arquitecturas de Software (ARSW) · 2026
