Este es el proyecto GrowLink ya construido. Necesito que lo eleves significativamente en calidad visual y completes TODA la funcionalidad del producto según el backlog real que te detallo abajo. No reconstruyas desde cero lo que ya funciona bien (Auth, Subasta en Tiempo Real, Duelo de Trivia) — úsalo como referencia de la calidad que debe tener el resto.

=========================================
PROBLEMA A RESOLVER: LA APP SE VE PLANA Y GENÉRICA
=========================================
Las pantallas de Auth, Subasta en Tiempo Real y Duelo de Trivia tienen buena calidad (tema navy dramático, jerarquía clara, tipografía con personalidad). El resto (Marketplace, Roadmap, Detalle de Oportunidad, Mi Meta) se ve plano, con demasiado espacio blanco vacío y tarjetas genéricas de SaaS. Eleva TODAS las pantallas al mismo nivel:
- Elimina el espacio vacío sin propósito (especialmente en Mi Meta, que hoy es una sola tarjeta perdida en un lienzo blanco enorme).
- Agrega textura de marca: fondos con degradado parcial sutil (azul #1E73E8 → teal #12C2A8 → verde #4CE07E), no solo blanco plano.
- Varía el tamaño de las tarjetas según importancia real (ej. en Marketplace, una oportunidad con 97% de match debe verse notoriamente más grande/destacada que una genérica, no todas iguales).
- El sidebar de Detalle de Oportunidad debe llevar color/textura de marca, no quedar blanco desconectado del resto.
- Sigue evitando el look genérico de IA: sin emojis como iconografía, sin bento-grids idénticos, sin bordes redondeados exagerados en todo, sin iconos outline genéricos de plantilla.

=========================================
MODO CLARO / MODO OSCURO
=========================================
Agrega un toggle de tema en el navbar, funcional en TODAS las pantallas sin excepción:
- Claro: fondo #F7F9FA, tarjetas blancas, texto navy (#0B1F3A).
- Oscuro: fondo navy (#0B1F3A), tarjetas en navy más claro (#132A47), texto claro.
- El degradado de marca se mantiene como acento en ambos modos.
- Guarda la preferencia en memoria de sesión.

=========================================
FUNCIONALIDAD COMPLETA — BACKLOG REAL (implementa lo que falte)
=========================================
La app debe cubrir TODAS estas historias, organizadas por Epic. Donde ya exista una pantalla que la cubra, perfecciónala; donde falte, créala:

EPIC 1 — Gestión de Perfil y Metas
- Registro de usuario, con selector de tipo de cuenta (Usuario / Profesor-Proveedor)
- Inicio de sesión y recuperación de contraseña
- Aprovisionamiento de cuenta de Administrador (un modo de acceso/simulación de rol admin)
- Editar y eliminar cuenta (agregar dentro de un menú de "Configuración de cuenta")
- Completar perfil profesional (experiencia, estudios, habilidades en tags, ingresos) CON indicador de completitud
- Editar perfil profesional
- Ver perfil propio y de terceros (vista pública de perfil, accesible por ejemplo desde el proveedor de una oportunidad)
- Definición de meta (financiera o profesional) y seguimiento de progreso hacia ella

EPIC 2 — Roadmap y Matching con IA
- Generación de roadmap con IA (timeline con pasos y estados)
- Recálculo automático del roadmap cuando cambia el perfil/meta (indicarlo visualmente, ej. badge "Actualizado")
- Regeneración manual del roadmap ("Regenerar con IA")
- Matching con notificación en tiempo real de oportunidades relevantes
- Búsqueda de oportunidades con filtros (sin depender de IA)
- Gestión de temáticas habilitadas (vista de administrador: crear/editar/desactivar categorías que habilitan roadmap e insignias)

EPIC 3 — Marketplace de Oportunidades y Servicios
- Publicación de curso/servicio (formulario para rol Profesor-Proveedor)
- Ver detalle de oportunidad
- Reserva de cupo limitado (con contador de cupos)
- Filtrado de oportunidades
- Identificar puja activa, ver requisitos antes de ofertar
- Precio y ganador en vivo durante la puja
- Notificación al cerrar la puja (ganador y no ganadores)
- Sugerencia de precio justo con IA (para quien publica un servicio)
- Monetización: pantalla o sección donde se vea la comisión por transacción aplicada, y gestión/estado de la Suscripción Plan Premium del usuario (upgrade, beneficios, precio)

EPIC 4 — Verificación de Habilidades
- Duelo de trivia modo Kahoot (todos responden al tiempo, gana el mayor puntaje)
- Duelo de trivia modo bloqueo (el primero en responder bien bloquea la pregunta)
- Leaderboard en vivo

EPIC 5 — Observabilidad y Métricas
- Dashboard de métricas para administrador (KPIs: % usuarios que logran su meta, tiempo a primera oportunidad relevante, % que completa el roadmap, ingreso adicional promedio por usuario) con gráficos de apoyo

=========================================
NAVEGACIÓN COMPLETA
=========================================
- El navbar debe permitir llegar a TODAS las pantallas anteriores sin usar URLs manuales.
- Agrega un menú de usuario (avatar/nombre) con: Ver perfil, Editar perfil, Configuración de cuenta, Plan/Suscripción, Cerrar sesión.
- Agrega acceso a vistas de Administrador (Dashboard de métricas, Gestión de temáticas) cuando el usuario simulado tenga rol Administrador — puedes incluir un selector simple de rol para poder navegar y demostrar ambas experiencias (usuario regular / administrador).

Al finalizar, devuelve un checklist con dos columnas: "Incluido" (cada historia de usuario del backlog que quedó implementada y navegable) y "No incluido / pendiente" (cualquiera que no lograste completar, con la razón).