Diseña e implementa un sistema de pantallas UI funcional para "GrowLink", una plataforma web que conecta las metas profesionales y financieras de una persona con oportunidades reales (cursos, empleos, servicios) para alcanzarlas, usando IA para generar un roadmap personalizado y hacer matching en tiempo real.

Usa el logo adjunto como referencia exacta de marca: extrae su paleta de colores (degradado azul a verde) y aplícala consistentemente en botones, acentos, indicadores de tiempo real y elementos de marca. Usa el logo en el header de cada pantalla.

ESTRUCTURA DEL PROYECTO (obligatoria, sigue esta organización de carpetas desde el inicio, no generes todo en un solo archivo):

src/
  assets/       -> imágenes, logo, iconos propios
  components/   -> componentes reutilizables (botones, tarjetas, inputs, navbar, badges)
  pages/        -> un archivo por cada una de las 10 pantallas completas
  hooks/        -> lógica reutilizable (ej. manejo de estado de un timer, de un formulario)
  services/     -> lógica simulada de datos (mock de oportunidades, mock de usuario, mock de roadmap)
  store/        -> manejo de estado global si aplica (usuario autenticado, meta activa)
  styles/       -> estilos globales, variables de color, tipografía
  types/        -> tipos de TypeScript para las entidades (Usuario, Oportunidad, Roadmap, Puja, etc.)
  App.tsx       -> solo enrutamiento/navegación entre páginas, sin lógica de UI pesada dentro

No mezcles todo en App.tsx. Cada pantalla debe ser su propio archivo dentro de pages/, importando componentes reutilizables desde components/.

CALIDAD — ESTO ES CRÍTICO, revisa antes de terminar:
- El resultado debe verse pulido y terminado en el preview, no a medio renderizar ni con elementos rotos, desalineados o sin estilos aplicados.
- Verifica que cada pantalla cargue visualmente completa, con toda la data de ejemplo (mock) visible, no placeholders vacíos tipo "Lorem ipsum" o cajas grises sin contenido.
- Todos los componentes reutilizables (botones, tarjetas, inputs) deben verse consistentes entre las 10 pantallas — mismo radio de bordes, mismo tratamiento de sombra, misma tipografía.
- Prueba mentalmente el flujo de navegación entre pantallas antes de terminar: debe ser posible pasar de una pantalla a otra de forma lógica (ej. desde Marketplace se puede llegar al Detalle de Oportunidad).
- Antes de finalizar, revisa que no haya errores de consola ni imports rotos.

IMPORTANTE — EVITAR QUE SE VEA "GENERADO POR IA":
- NO uses emojis como iconografía ni como viñetas de listas.
- NO uses el layout típico de SaaS genérico: hero centrado con título grande + subtítulo + botón redondeado + gradiente morado/azul de fondo.
- NO uses "bento grids" de tarjetas idénticas todas del mismo tamaño en grilla perfecta — varía tamaños y jerarquía según importancia real del contenido.
- NO uses sombras suaves difusas por defecto en todo, ni bordes redondeados exagerados en absolutamente todos los elementos.
- NO uses tipografía genérica sin criterio — elige una tipografía con personalidad, buen peso en bold para títulos, legible en texto.
- NO llenes cada pantalla con iconos de línea genéricos idénticos a cualquier plantilla — si usas iconos, dales un tratamiento visual distintivo (un solo color de acento, o estilo sólido en vez de outline).
- SÍ quiero un diseño intencional y editorial: asimetría cuando tenga sentido, jerarquía tipográfica marcada, y que cada pantalla refleje el problema real que resuelve (el roadmap debe sentirse como un camino/progreso real; la puja en vivo debe transmitir urgencia y tensión visual).
- SÍ quiero micro-momentos de marca: el degradado azul-verde del logo como acento intencional (una línea, un fondo parcial, un estado activo), no repetido sin criterio en cada botón.

SISTEMA DE DISEÑO:
- Paleta: azul (#1E73E8), teal (#12C2A8) y verde (#4CE07E) del logo como marca; navy oscuro (#0B1F3A) para texto de alto contraste; fondo blanco/gris muy claro (#F7F9FA).
- Indicadores de tiempo real: un tratamiento visual propio y consistente para todo lo que se actualice en vivo (notificaciones, pujas, duelos), coherente con la marca.

Diseña las siguientes 10 pantallas, en escritorio (desktop-first, 1440px):

1. REGISTRO / LOGIN
Formulario de registro con nombre, correo, contraseña, y selector de tipo de cuenta (Usuario regular / Profesor-Proveedor). Incluye también login y "olvidé mi contraseña".

2. COMPLETAR PERFIL PROFESIONAL
Formulario multi-sección: experiencia, estudios, habilidades (tags seleccionables), ingresos actuales. Indicador de completitud del perfil.

3. DEFINIR META
Selección de tipo de meta (financiera/profesional), monto o puesto objetivo, plazo. Tarjeta de progreso hacia la meta cuando ya existe una activa.

4. ROADMAP GENERADO CON IA
Los pasos del roadmap como un recorrido/camino real, cada paso con estado (pendiente/completado). Opción de regenerar visible.

5. MARKETPLACE — LISTADO DE OPORTUNIDADES
Oportunidades (curso, empleo, servicio) con jerarquía visual clara según relevancia/urgencia. Búsqueda y filtros. Notificación de match relevante con tratamiento de "señal activa" propio.

6. DETALLE DE OPORTUNIDAD
Descripción completa, proveedor, precio, y la acción correspondiente: "Reservar cupo" (con cupos restantes) o "Ver puja en vivo".

7. PUJA EN TIEMPO REAL
Precio actual destacado, quién va ganando, cuenta regresiva, campo de nueva oferta, feed de ofertas recientes en vivo. Debe transmitir urgencia real.

8. DUELO DE TRIVIA EN TIEMPO REAL (MODO KAHOOT)
Pregunta centrada, opciones de respuesta, cuenta regresiva, marcador de jugadores. Incluye vista de leaderboard en vivo.

9. DASHBOARD DE MÉTRICAS (ADMIN)
KPIs destacados (usuarios activos, % que logra su meta, ingreso promedio) con jerarquía clara del KPI más importante, y gráficos de apoyo debajo.

10. PANEL ADMIN — GESTIÓN DE TEMÁTICAS
Lista de temáticas habilitadas, con creación/edición/desactivación.

AL FINAL, DEVUELVE UN CHECKLIST en texto plano con dos columnas:
- "Incluido": cada elemento de este prompt que sí lograste aplicar (estructura de carpetas, paleta, tipografía, las 10 pantallas, tratamiento de tiempo real, restricciones anti-genérico, revisión de calidad).
- "No incluido / pendiente": cualquier instrucción que no pudiste aplicar completamente, con una breve razón.