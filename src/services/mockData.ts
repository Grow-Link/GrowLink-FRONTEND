import type {
  SeedUser,
  UserProfile,
  Course,
  CourseCompletion,
  TriviaQuestion,
  AdminMetrics,
} from '../types';
import { CATEGORIAS_CURSOS } from './cursosServiceApi';

export const SEED_USERS: SeedUser[] = [
  { id: 'u1', name: 'Valentina Ríos', role: 'user', headline: 'Analista Junior · Grupo Financiero Norte' },
  { id: 'u2', name: 'Carlos Méndez', role: 'user', headline: 'Asistente de Operaciones · StartupMX' },
  { id: 'u3', name: 'Ana Torres', role: 'user', headline: 'Coordinadora de Datos · Banco Región' },
  { id: 'p1', name: 'Andrea Salazar', role: 'publisher', headline: 'Directora académica', org: 'DataFinance Academy' },
  { id: 'p2', name: 'Julián Restrepo', role: 'publisher', headline: 'Fundador', org: 'CodeLab Bootcamp' },
  { id: 'admin1', name: 'Mariana Duarte', role: 'admin', headline: 'Operaciones de plataforma', org: 'GrowLink' },
];

// Misma taxonomía que PublishCoursePage usa contra cursos-service — una sola fuente de verdad.
export const CATEGORIES: string[] = [...CATEGORIAS_CURSOS];

export const LEVELS: { value: Course['level']; label: string }[] = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export const INTERESTS_OPTIONS = [...CATEGORIES];

export const mockCourses: Course[] = [
  // ─── Ingeniería de Sistemas ──────────────────────────────────
  {
    id: 'sis-1', title: 'Fundamentos de Programación', description: 'Lógica, variables, control de flujo y buenas prácticas para escribir tu primer código.',
    category: 'Ingeniería de Sistemas', level: 'principiante', skills: ['Programación'], contentUrl: 'https://cursos.growlink.com/fundamentos-programacion',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-10',
  },
  {
    id: 'sis-2', title: 'Bases de Datos Relacionales', description: 'Modelado entidad-relación, normalización y consultas SQL para sistemas de información.',
    category: 'Ingeniería de Sistemas', level: 'principiante', skills: ['Bases de Datos'], contentUrl: 'https://cursos.growlink.com/bases-de-datos',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-01-18',
  },
  {
    id: 'sis-3', title: 'Estructuras de Datos y Algoritmos', description: 'Pilas, colas, árboles y complejidad algorítmica aplicados a problemas reales de software.',
    category: 'Ingeniería de Sistemas', level: 'intermedio', skills: ['Estructuras de Datos', 'Ingeniería de Software'], contentUrl: 'https://cursos.growlink.com/estructuras-de-datos',
    prerequisites: ['sis-1', 'sis-2'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-02',
  },
  {
    id: 'sis-4', title: 'Redes y Sistemas Operativos', description: 'Arquitectura de redes TCP/IP, procesos, memoria y administración de sistemas operativos.',
    category: 'Ingeniería de Sistemas', level: 'intermedio', skills: ['Redes', 'Sistemas Operativos'], contentUrl: 'https://cursos.growlink.com/redes-sistemas-operativos',
    prerequisites: ['sis-1'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-02-14',
  },
  {
    id: 'sis-5', title: 'Inteligencia Artificial Aplicada', description: 'Modelos de aprendizaje automático y redes neuronales para resolver problemas de negocio.',
    category: 'Ingeniería de Sistemas', level: 'avanzado', skills: ['Inteligencia Artificial'], contentUrl: 'https://cursos.growlink.com/inteligencia-artificial',
    prerequisites: ['sis-3'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-03-05',
  },
  {
    id: 'sis-6', title: 'Ciberseguridad Ofensiva', description: 'Pruebas de penetración, análisis de vulnerabilidades y hardening de sistemas.',
    category: 'Ingeniería de Sistemas', level: 'avanzado', skills: ['Ciberseguridad'], contentUrl: 'https://cursos.growlink.com/ciberseguridad-ofensiva',
    prerequisites: ['sis-4'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'inactive', createdAt: '2025-03-20',
  },

  // ─── Ingeniería Civil ────────────────────────────────────────
  {
    id: 'civ-1', title: 'Topografía Aplicada', description: 'Levantamiento de terrenos, nivelación y uso de estación total para proyectos de construcción.',
    category: 'Ingeniería Civil', level: 'principiante', skills: ['Topografía'], contentUrl: 'https://cursos.growlink.com/topografia-aplicada',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-12',
  },
  {
    id: 'civ-2', title: 'Materiales de Construcción', description: 'Propiedades del concreto, acero y agregados usados en obras civiles.',
    category: 'Ingeniería Civil', level: 'principiante', skills: ['Materiales de Construcción'], contentUrl: 'https://cursos.growlink.com/materiales-construccion',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-01-22',
  },
  {
    id: 'civ-3', title: 'Análisis Estructural', description: 'Cálculo de esfuerzos, cargas y deformaciones en estructuras de concreto y acero.',
    category: 'Ingeniería Civil', level: 'intermedio', skills: ['Estructuras'], contentUrl: 'https://cursos.growlink.com/analisis-estructural',
    prerequisites: ['civ-2'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-10',
  },
  {
    id: 'civ-4', title: 'Geotecnia y Cimentaciones', description: 'Mecánica de suelos y diseño de cimentaciones para distintas condiciones de terreno.',
    category: 'Ingeniería Civil', level: 'avanzado', skills: ['Geotecnia'], contentUrl: 'https://cursos.growlink.com/geotecnia-cimentaciones',
    prerequisites: ['civ-3', 'civ-1'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-08',
  },

  // ─── Ingeniería Industrial ───────────────────────────────────
  {
    id: 'ind-1', title: 'Gestión de Procesos Industriales', description: 'Mapeo, análisis y mejora de procesos productivos con metodologías lean.',
    category: 'Ingeniería Industrial', level: 'principiante', skills: ['Gestión de Procesos'], contentUrl: 'https://cursos.growlink.com/gestion-procesos',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-14',
  },
  {
    id: 'ind-2', title: 'Fundamentos de Logística', description: 'Cadena de suministro, inventarios y distribución para operaciones eficientes.',
    category: 'Ingeniería Industrial', level: 'principiante', skills: ['Logística'], contentUrl: 'https://cursos.growlink.com/fundamentos-logistica',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-01-26',
  },
  {
    id: 'ind-3', title: 'Control de Calidad y Producción', description: 'Herramientas estadísticas de calidad y planeación de la producción.',
    category: 'Ingeniería Industrial', level: 'intermedio', skills: ['Control de Calidad', 'Gestión de Producción'], contentUrl: 'https://cursos.growlink.com/control-calidad',
    prerequisites: ['ind-1'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-16',
  },
  {
    id: 'ind-4', title: 'Investigación de Operaciones', description: 'Modelos de optimización y simulación para la toma de decisiones industriales.',
    category: 'Ingeniería Industrial', level: 'avanzado', skills: ['Investigación de Operaciones'], contentUrl: 'https://cursos.growlink.com/investigacion-operaciones',
    prerequisites: ['ind-3', 'ind-2'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-12',
  },

  // ─── Ingeniería Electrónica ──────────────────────────────────
  {
    id: 'ele-1', title: 'Circuitos Eléctricos', description: 'Leyes de Ohm y Kirchhoff, y análisis de circuitos de corriente directa y alterna.',
    category: 'Ingeniería Electrónica', level: 'principiante', skills: ['Circuitos Eléctricos'], contentUrl: 'https://cursos.growlink.com/circuitos-electricos',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-16',
  },
  {
    id: 'ele-2', title: 'Electrónica Digital', description: 'Álgebra booleana, compuertas lógicas y diseño de circuitos digitales.',
    category: 'Ingeniería Electrónica', level: 'principiante', skills: ['Electrónica Digital'], contentUrl: 'https://cursos.growlink.com/electronica-digital',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-01-28',
  },
  {
    id: 'ele-3', title: 'Microcontroladores y Sistemas Embebidos', description: 'Programación de microcontroladores para proyectos de automatización y IoT.',
    category: 'Ingeniería Electrónica', level: 'intermedio', skills: ['Microcontroladores'], contentUrl: 'https://cursos.growlink.com/microcontroladores',
    prerequisites: ['ele-2'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-18',
  },
  {
    id: 'ele-4', title: 'Sistemas de Control y Telecomunicaciones', description: 'Control automático de procesos y fundamentos de transmisión de señales.',
    category: 'Ingeniería Electrónica', level: 'avanzado', skills: ['Sistemas de Control', 'Telecomunicaciones'], contentUrl: 'https://cursos.growlink.com/control-telecomunicaciones',
    prerequisites: ['ele-3', 'ele-1'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-14',
  },

  // ─── Ingeniería Mecánica ─────────────────────────────────────
  {
    id: 'mec-1', title: 'Termodinámica Aplicada', description: 'Leyes de la termodinámica, ciclos térmicos y máquinas de conversión de energía.',
    category: 'Ingeniería Mecánica', level: 'principiante', skills: ['Termodinámica'], contentUrl: 'https://cursos.growlink.com/termodinamica-aplicada',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-20',
  },
  {
    id: 'mec-2', title: 'Mecánica de Materiales', description: 'Esfuerzos, deformaciones y resistencia de materiales en elementos mecánicos.',
    category: 'Ingeniería Mecánica', level: 'principiante', skills: ['Mecánica de Materiales'], contentUrl: 'https://cursos.growlink.com/mecanica-materiales',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-02-01',
  },
  {
    id: 'mec-3', title: 'Diseño Mecánico Asistido por Computadora', description: 'Modelado CAD y criterios de diseño de piezas y ensambles mecánicos.',
    category: 'Ingeniería Mecánica', level: 'intermedio', skills: ['Diseño Mecánico'], contentUrl: 'https://cursos.growlink.com/diseno-mecanico-cad',
    prerequisites: ['mec-2'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-22',
  },
  {
    id: 'mec-4', title: 'Manufactura y Mecánica de Fluidos', description: 'Procesos de manufactura y comportamiento de fluidos en sistemas mecánicos.',
    category: 'Ingeniería Mecánica', level: 'avanzado', skills: ['Manufactura', 'Mecánica de Fluidos'], contentUrl: 'https://cursos.growlink.com/manufactura-fluidos',
    prerequisites: ['mec-3', 'mec-1'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-16',
  },

  // ─── Ingeniería Ambiental ────────────────────────────────────
  {
    id: 'amb-1', title: 'Gestión Ambiental Empresarial', description: 'Normativa ambiental y sistemas de gestión para reducir el impacto de las operaciones.',
    category: 'Ingeniería Ambiental', level: 'principiante', skills: ['Gestión Ambiental'], contentUrl: 'https://cursos.growlink.com/gestion-ambiental',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-24',
  },
  {
    id: 'amb-2', title: 'Sostenibilidad y Desarrollo Sostenible', description: 'Principios de sostenibilidad aplicados a proyectos de infraestructura e industria.',
    category: 'Ingeniería Ambiental', level: 'principiante', skills: ['Sostenibilidad'], contentUrl: 'https://cursos.growlink.com/sostenibilidad',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-02-04',
  },
  {
    id: 'amb-3', title: 'Tratamiento de Aguas Residuales', description: 'Procesos físicos, químicos y biológicos para el tratamiento de agua.',
    category: 'Ingeniería Ambiental', level: 'intermedio', skills: ['Tratamiento de Aguas'], contentUrl: 'https://cursos.growlink.com/tratamiento-aguas',
    prerequisites: ['amb-1'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-26',
  },
  {
    id: 'amb-4', title: 'Evaluación de Impacto Ambiental', description: 'Metodologías para evaluar y mitigar el impacto ambiental de proyectos.',
    category: 'Ingeniería Ambiental', level: 'avanzado', skills: ['Evaluación de Impacto Ambiental'], contentUrl: 'https://cursos.growlink.com/evaluacion-impacto-ambiental',
    prerequisites: ['amb-3', 'amb-2'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-18',
  },

  // ─── Matemáticas ─────────────────────────────────────────────
  {
    id: 'mat-1', title: 'Cálculo Diferencial e Integral', description: 'Límites, derivadas e integrales aplicados a problemas de ingeniería.',
    category: 'Matemáticas', level: 'principiante', skills: ['Cálculo'], contentUrl: 'https://cursos.growlink.com/calculo-diferencial-integral',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-11',
  },
  {
    id: 'mat-2', title: 'Álgebra Lineal', description: 'Vectores, matrices y transformaciones lineales con aplicaciones prácticas.',
    category: 'Matemáticas', level: 'principiante', skills: ['Álgebra Lineal'], contentUrl: 'https://cursos.growlink.com/algebra-lineal',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-01-21',
  },
  {
    id: 'mat-3', title: 'Estadística y Probabilidad', description: 'Distribuciones, inferencia estadística y análisis de datos para la toma de decisiones.',
    category: 'Matemáticas', level: 'intermedio', skills: ['Estadística'], contentUrl: 'https://cursos.growlink.com/estadistica-probabilidad',
    prerequisites: ['mat-1'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-06',
  },
  {
    id: 'mat-4', title: 'Ecuaciones Diferenciales y Métodos Numéricos', description: 'Modelado de fenómenos dinámicos y técnicas numéricas para resolverlos.',
    category: 'Matemáticas', level: 'avanzado', skills: ['Ecuaciones Diferenciales', 'Métodos Numéricos'], contentUrl: 'https://cursos.growlink.com/ecuaciones-metodos-numericos',
    prerequisites: ['mat-1', 'mat-2'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-02',
  },

  // ─── Administración de Empresas ──────────────────────────────
  {
    id: 'adm-1', title: 'Contabilidad para no Contadores', description: 'Balance, estado de resultados y flujo de caja explicados sin tecnicismos.',
    category: 'Administración de Empresas', level: 'principiante', skills: ['Contabilidad'], contentUrl: 'https://cursos.growlink.com/contabilidad-no-contadores',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-13',
  },
  {
    id: 'adm-2', title: 'Fundamentos de Mercadeo', description: 'Segmentación, posicionamiento y mezcla de mercadotecnia para cualquier negocio.',
    category: 'Administración de Empresas', level: 'principiante', skills: ['Mercadeo'], contentUrl: 'https://cursos.growlink.com/fundamentos-mercadeo',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-01-27',
  },
  {
    id: 'adm-3', title: 'Finanzas Corporativas', description: 'Análisis financiero, presupuestos y evaluación de proyectos de inversión.',
    category: 'Administración de Empresas', level: 'intermedio', skills: ['Finanzas'], contentUrl: 'https://cursos.growlink.com/finanzas-corporativas',
    prerequisites: ['adm-1'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-17',
  },
  {
    id: 'adm-4', title: 'Gestión Estratégica y de Proyectos', description: 'Planeación estratégica y dirección de proyectos de principio a fin.',
    category: 'Administración de Empresas', level: 'avanzado', skills: ['Gestión Estratégica', 'Gestión de Proyectos'], contentUrl: 'https://cursos.growlink.com/gestion-estrategica-proyectos',
    prerequisites: ['adm-3', 'adm-2'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-10',
  },

  // ─── Idiomas ──────────────────────────────────────────────────
  {
    id: 'idi-1', title: 'Inglés Básico', description: 'Gramática esencial y vocabulario para comunicarte en situaciones cotidianas.',
    category: 'Idiomas', level: 'principiante', skills: ['Inglés'], contentUrl: 'https://cursos.growlink.com/ingles-basico',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-15',
  },
  {
    id: 'idi-2', title: 'Comprensión Lectora en Inglés', description: 'Técnicas de lectura para entender textos técnicos y académicos en inglés.',
    category: 'Idiomas', level: 'principiante', skills: ['Comprensión Lectora'], contentUrl: 'https://cursos.growlink.com/comprension-lectora-ingles',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-01-25',
  },
  {
    id: 'idi-3', title: 'Conversación y Escritura Académica en Inglés', description: 'Práctica oral y redacción de ensayos y reportes en inglés académico.',
    category: 'Idiomas', level: 'intermedio', skills: ['Conversación', 'Escritura Académica'], contentUrl: 'https://cursos.growlink.com/conversacion-escritura-academica',
    prerequisites: ['idi-1', 'idi-2'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-20',
  },
  {
    id: 'idi-4', title: 'Francés Intermedio', description: 'Gramática, vocabulario y conversación de nivel intermedio en francés.',
    category: 'Idiomas', level: 'avanzado', skills: ['Francés'], contentUrl: 'https://cursos.growlink.com/frances-intermedio',
    prerequisites: ['idi-3'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-22',
  },

  // ─── Derecho ──────────────────────────────────────────────────
  {
    id: 'der-1', title: 'Introducción al Derecho Civil', description: 'Personas, bienes y obligaciones: los pilares del derecho civil.',
    category: 'Derecho', level: 'principiante', skills: ['Derecho Civil'], contentUrl: 'https://cursos.growlink.com/introduccion-derecho-civil',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-17',
  },
  {
    id: 'der-2', title: 'Derecho Constitucional', description: 'Organización del Estado, derechos fundamentales y control constitucional.',
    category: 'Derecho', level: 'principiante', skills: ['Derecho Constitucional'], contentUrl: 'https://cursos.growlink.com/derecho-constitucional',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-01-29',
  },
  {
    id: 'der-3', title: 'Derecho Laboral', description: 'Relaciones entre empleadores y trabajadores, contratos y seguridad social.',
    category: 'Derecho', level: 'intermedio', skills: ['Derecho Laboral'], contentUrl: 'https://cursos.growlink.com/derecho-laboral',
    prerequisites: ['der-1'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-24',
  },
  {
    id: 'der-4', title: 'Derecho Comercial y Derechos Humanos', description: 'Sociedades, contratos mercantiles y el marco internacional de derechos humanos.',
    category: 'Derecho', level: 'avanzado', skills: ['Derecho Comercial', 'Derechos Humanos'], contentUrl: 'https://cursos.growlink.com/derecho-comercial-dh',
    prerequisites: ['der-3', 'der-2'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-24',
  },
];

export const mockProfiles: Record<string, UserProfile> = {
  u2: {
    userId: 'u2',
    goals: 'Quiero pasar de un rol operativo a uno de desarrollo de software en los próximos 8 meses.',
    interests: ['Ingeniería de Sistemas', 'Administración de Empresas'],
    level: 'principiante',
    updatedAt: '2025-08-01',
  },
  u3: {
    userId: 'u3',
    goals: 'Convertirme en líder técnica de un equipo de desarrollo de software.',
    interests: ['Ingeniería de Sistemas', 'Administración de Empresas'],
    level: 'intermedio',
    updatedAt: '2025-06-10',
  },
};

export const mockCompletions: CourseCompletion[] = [
  { id: 'cc1', userId: 'u3', courseId: 'sis-1', courseTitle: 'Fundamentos de Programación', category: 'Ingeniería de Sistemas', skillsUnlocked: ['Programación'], completedAt: '2025-06-20' },
  { id: 'cc2', userId: 'u3', courseId: 'sis-2', courseTitle: 'Bases de Datos Relacionales', category: 'Ingeniería de Sistemas', skillsUnlocked: ['Bases de Datos'], completedAt: '2025-07-02' },
  { id: 'cc3', userId: 'u3', courseId: 'adm-1', courseTitle: 'Contabilidad para no Contadores', category: 'Administración de Empresas', skillsUnlocked: ['Contabilidad'], completedAt: '2025-07-10' },
  { id: 'cc4', userId: 'u3', courseId: 'sis-3', courseTitle: 'Estructuras de Datos y Algoritmos', category: 'Ingeniería de Sistemas', skillsUnlocked: ['Estructuras de Datos', 'Ingeniería de Software'], completedAt: '2025-08-05' },
];

export const mockTriviaQuestions: TriviaQuestion[] = [
  { id: 'q1', category: 'Ingeniería de Sistemas', question: '¿Qué estructura de datos sigue el principio "último en entrar, primero en salir" (LIFO)?', options: ['Pila', 'Cola', 'Árbol', 'Grafo'], correctIndex: 0 },
  { id: 'q2', category: 'Ingeniería de Sistemas', question: '¿Qué capa del modelo OSI se encarga del enrutamiento de paquetes?', options: ['Física', 'Red', 'Transporte', 'Aplicación'], correctIndex: 1 },
  { id: 'q3', category: 'Ingeniería Civil', question: '¿Qué ensayo mide la capacidad portante de un suelo?', options: ['Ensayo de compresión', 'Ensayo de penetración estándar (SPT)', 'Ensayo de tracción', 'Ensayo de dureza'], correctIndex: 1 },
  { id: 'q4', category: 'Ingeniería Civil', question: '¿Qué material se usa principalmente para resistir esfuerzos de compresión en estructuras?', options: ['Acero', 'Concreto', 'Madera', 'Vidrio'], correctIndex: 1 },
  { id: 'q5', category: 'Ingeniería Industrial', question: '¿Qué metodología japonesa busca la mejora continua mediante pequeños cambios incrementales?', options: ['Kaizen', 'Just in Time', 'Seis Sigma', 'Benchmarking'], correctIndex: 0 },
  { id: 'q6', category: 'Ingeniería Industrial', question: '¿Qué herramienta de calidad representa relaciones causa-efecto?', options: ['Diagrama de Pareto', 'Diagrama de Ishikawa', 'Histograma', 'Diagrama de flujo'], correctIndex: 1, publisherId: 'p2' },
  { id: 'q7', category: 'Ingeniería Electrónica', question: '¿Qué ley relaciona voltaje, corriente y resistencia en un circuito?', options: ['Ley de Kirchhoff', 'Ley de Ohm', 'Ley de Coulomb', 'Ley de Faraday'], correctIndex: 1 },
  { id: 'q8', category: 'Ingeniería Electrónica', question: '¿Qué componente almacena energía en forma de campo eléctrico?', options: ['Resistencia', 'Capacitor', 'Inductor', 'Diodo'], correctIndex: 1 },
  { id: 'q9', category: 'Ingeniería Mecánica', question: '¿Qué ley de la termodinámica establece que la energía no se crea ni se destruye?', options: ['Primera ley', 'Segunda ley', 'Tercera ley', 'Ley cero'], correctIndex: 0 },
  { id: 'q10', category: 'Ingeniería Mecánica', question: '¿Qué proceso de manufactura da forma al metal mediante fuerza de compresión?', options: ['Mecanizado', 'Fundición', 'Forjado', 'Soldadura'], correctIndex: 2 },
  { id: 'q11', category: 'Ingeniería Ambiental', question: '¿Qué proceso elimina contaminantes del agua antes de su vertido o reutilización?', options: ['Tratamiento de aguas residuales', 'Compostaje', 'Reforestación', 'Incineración'], correctIndex: 0 },
  { id: 'q12', category: 'Ingeniería Ambiental', question: '¿Qué estudio evalúa los efectos de un proyecto sobre el entorno antes de ejecutarlo?', options: ['Auditoría financiera', 'Evaluación de Impacto Ambiental', 'Estudio de mercado', 'Censo poblacional'], correctIndex: 1 },
  { id: 'q13', category: 'Matemáticas', question: '¿Qué rama de las matemáticas estudia tasas de cambio y acumulación?', options: ['Álgebra', 'Cálculo', 'Geometría', 'Estadística'], correctIndex: 1 },
  { id: 'q14', category: 'Matemáticas', question: '¿Qué método numérico se usa para aproximar raíces de ecuaciones no lineales?', options: ['Newton-Raphson', 'Regla de tres', 'Eliminación gaussiana', 'Interpolación lineal'], correctIndex: 0 },
  { id: 'q15', category: 'Administración de Empresas', question: '¿Qué estado financiero muestra activos, pasivos y patrimonio en un momento dado?', options: ['Estado de resultados', 'Balance general', 'Flujo de caja', 'Libro mayor'], correctIndex: 1 },
  { id: 'q16', category: 'Administración de Empresas', question: '¿Qué herramienta analiza fortalezas, oportunidades, debilidades y amenazas de un negocio?', options: ['Análisis FODA', 'Diagrama de Gantt', 'Curva de demanda', 'Matriz BCG'], correctIndex: 0 },
  { id: 'q17', category: 'Idiomas', question: '¿Cuál es la forma correcta del verbo "to be" en tercera persona del singular?', options: ['am', 'is', 'are', 'be'], correctIndex: 1 },
  { id: 'q18', category: 'Idiomas', question: '¿Qué habilidad se enfoca en entender un texto escrito?', options: ['Conversación', 'Escritura', 'Comprensión Lectora', 'Pronunciación'], correctIndex: 2 },
  { id: 'q19', category: 'Derecho', question: '¿Qué rama del derecho regula las relaciones entre empleadores y trabajadores?', options: ['Derecho Civil', 'Derecho Laboral', 'Derecho Comercial', 'Derecho Constitucional'], correctIndex: 1 },
  { id: 'q20', category: 'Derecho', question: '¿Qué documento fundamental establece la organización política de un Estado?', options: ['Código Civil', 'Constitución', 'Código de Comercio', 'Reglamento interno'], correctIndex: 1 },
];

export const mockAdminMetrics: AdminMetrics = {
  activeUsers: 14832,
  userGrowthPercent: 23.4,
  roadmapCompletionRate: 41.2,
  activeCourses: mockCourses.filter((c) => c.status === 'active').length,
  activeTriviaRoomsNow: 18,
  peakConcurrentToday: 612,
  monthlyData: [
    { month: 'Mar', users: 8200, completions: 410, coursesPublished: 12 },
    { month: 'Abr', users: 9400, completions: 510, coursesPublished: 9 },
    { month: 'May', users: 10100, completions: 590, coursesPublished: 14 },
    { month: 'Jun', users: 11300, completions: 680, coursesPublished: 11 },
    { month: 'Jul', users: 12800, completions: 790, coursesPublished: 17 },
    { month: 'Ago', users: 14200, completions: 910, coursesPublished: 15 },
    { month: 'Sep', users: 14832, completions: 1020, coursesPublished: 8 },
  ],
  concurrency: [
    { time: '00:00', activeUsers: 210, activeTriviaRooms: 3 },
    { time: '04:00', activeUsers: 96, activeTriviaRooms: 1 },
    { time: '08:00', activeUsers: 340, activeTriviaRooms: 6 },
    { time: '12:00', activeUsers: 528, activeTriviaRooms: 12 },
    { time: '16:00', activeUsers: 612, activeTriviaRooms: 18 },
    { time: '20:00', activeUsers: 475, activeTriviaRooms: 14 },
    { time: '23:59', activeUsers: 288, activeTriviaRooms: 7 },
  ],
  categoryDistribution: CATEGORIES.map((category) => ({
    category,
    count: mockCourses.filter((c) => c.category === category).length,
  })),
};
