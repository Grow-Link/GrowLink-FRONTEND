import type {
  SeedUser,
  UserProfile,
  Course,
  Roadmap,
  CourseCompletion,
  TriviaQuestion,
  AdminMetrics,
} from '../types';

export const SEED_USERS: SeedUser[] = [
  { id: 'u1', name: 'Valentina Ríos', role: 'user', headline: 'Analista Junior · Grupo Financiero Norte' },
  { id: 'u2', name: 'Carlos Méndez', role: 'user', headline: 'Asistente de Operaciones · StartupMX' },
  { id: 'u3', name: 'Ana Torres', role: 'user', headline: 'Coordinadora de Datos · Banco Región' },
  { id: 'p1', name: 'Andrea Salazar', role: 'publisher', headline: 'Directora académica', org: 'DataFinance Academy' },
  { id: 'p2', name: 'Julián Restrepo', role: 'publisher', headline: 'Fundador', org: 'CodeLab Bootcamp' },
  { id: 'admin1', name: 'Mariana Duarte', role: 'admin', headline: 'Operaciones de plataforma', org: 'GrowLink' },
];

export const CATEGORIES = [
  'Ciencia de Datos',
  'Desarrollo de Software',
  'Finanzas',
  'Marketing Digital',
  'Liderazgo',
];

export const LEVELS: { value: Course['level']; label: string }[] = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export const INTERESTS_OPTIONS = [...CATEGORIES];

export const mockCourses: Course[] = [
  {
    id: 'c1', title: 'Fundamentos de Python', description: 'Sintaxis, estructuras de datos y automatización básica con Python para análisis de datos.',
    category: 'Ciencia de Datos', level: 'principiante', skills: ['Python'], contentUrl: 'https://cursos.growlink.com/python-fundamentos',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-01',
  },
  {
    id: 'c2', title: 'Estadística para Datos', description: 'Probabilidad, distribuciones y pruebas de hipótesis aplicadas a problemas reales de negocio.',
    category: 'Ciencia de Datos', level: 'principiante', skills: ['Estadística'], contentUrl: 'https://cursos.growlink.com/estadistica-datos',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-08',
  },
  {
    id: 'c3', title: 'SQL para Análisis', description: 'De consultas simples a CTEs y window functions para explotar bases de datos relacionales.',
    category: 'Ciencia de Datos', level: 'intermedio', skills: ['SQL'], contentUrl: 'https://cursos.growlink.com/sql-analisis',
    prerequisites: ['c1'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-20',
  },
  {
    id: 'c4', title: 'Machine Learning Aplicado a Finanzas', description: 'Modelos predictivos, scoring crediticio y detección de fraude con datasets reales.',
    category: 'Ciencia de Datos', level: 'intermedio', skills: ['Machine Learning'], contentUrl: 'https://cursos.growlink.com/ml-finanzas',
    prerequisites: ['c1', 'c2'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-03-05',
  },
  {
    id: 'c5', title: 'Deep Learning Avanzado', description: 'Redes neuronales profundas, visión computacional y despliegue de modelos en producción.',
    category: 'Ciencia de Datos', level: 'avanzado', skills: ['Deep Learning'], contentUrl: 'https://cursos.growlink.com/deep-learning',
    prerequisites: ['c4'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-04-01',
  },
  {
    id: 'c6', title: 'Fundamentos de JavaScript', description: 'Lógica de programación, DOM y asincronía para dar el salto al desarrollo web.',
    category: 'Desarrollo de Software', level: 'principiante', skills: ['JavaScript'], contentUrl: 'https://cursos.growlink.com/js-fundamentos',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-02-10',
  },
  {
    id: 'c7', title: 'React desde Cero', description: 'Componentes, estado y hooks para construir interfaces modernas.',
    category: 'Desarrollo de Software', level: 'intermedio', skills: ['React'], contentUrl: 'https://cursos.growlink.com/react-cero',
    prerequisites: ['c6'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-01',
  },
  {
    id: 'c8', title: 'Arquitectura de Software', description: 'Patrones de diseño, escalabilidad y decisiones técnicas para sistemas en producción.',
    category: 'Desarrollo de Software', level: 'avanzado', skills: ['Arquitectura de software'], contentUrl: 'https://cursos.growlink.com/arquitectura-software',
    prerequisites: ['c7'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'inactive', createdAt: '2025-03-15',
  },
  {
    id: 'c9', title: 'Finanzas Personales 101', description: 'Presupuesto, ahorro y control de gasto para tomar decisiones financieras informadas.',
    category: 'Finanzas', level: 'principiante', skills: ['Presupuesto personal'], contentUrl: 'https://cursos.growlink.com/finanzas-101',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-20',
  },
  {
    id: 'c10', title: 'Análisis Financiero', description: 'Lectura de estados financieros, ratios clave y salud financiera de una empresa.',
    category: 'Finanzas', level: 'intermedio', skills: ['Análisis financiero'], contentUrl: 'https://cursos.growlink.com/analisis-financiero',
    prerequisites: ['c9'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-02-15',
  },
  {
    id: 'c11', title: 'Valoración de Empresas', description: 'Métodos de valoración (DCF, múltiplos) usados en banca de inversión y M&A.',
    category: 'Finanzas', level: 'avanzado', skills: ['Valoración'], contentUrl: 'https://cursos.growlink.com/valoracion-empresas',
    prerequisites: ['c10'], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-03-20',
  },
  {
    id: 'c12', title: 'Fundamentos de Marketing Digital', description: 'Embudos, canales pagados y orgánicos, y métricas que sí importan.',
    category: 'Marketing Digital', level: 'principiante', skills: ['Marketing digital'], contentUrl: 'https://cursos.growlink.com/marketing-fundamentos',
    prerequisites: [], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-02-05',
  },
  {
    id: 'c13', title: 'SEO y Growth', description: 'Estrategias de posicionamiento orgánico y experimentación para crecimiento sostenido.',
    category: 'Marketing Digital', level: 'intermedio', skills: ['SEO'], contentUrl: 'https://cursos.growlink.com/seo-growth',
    prerequisites: ['c12'], publisherId: 'p2', publisherName: 'CodeLab Bootcamp', status: 'active', createdAt: '2025-03-10',
  },
  {
    id: 'c14', title: 'Liderazgo de Equipos', description: 'Comunicación, feedback y gestión de conflictos para liderar equipos de alto desempeño.',
    category: 'Liderazgo', level: 'intermedio', skills: ['Liderazgo'], contentUrl: 'https://cursos.growlink.com/liderazgo-equipos',
    prerequisites: [], publisherId: 'p1', publisherName: 'DataFinance Academy', status: 'active', createdAt: '2025-01-28',
  },
];

export const mockProfiles: Record<string, UserProfile> = {
  u2: {
    userId: 'u2',
    goals: 'Quiero pasar de un rol operativo a uno de análisis de datos en los próximos 8 meses.',
    interests: ['Ciencia de Datos', 'Finanzas'],
    level: 'principiante',
    updatedAt: '2025-08-01',
  },
  u3: {
    userId: 'u3',
    goals: 'Convertirme en Analista Senior de Datos dentro del sector financiero.',
    interests: ['Ciencia de Datos', 'Finanzas'],
    level: 'intermedio',
    updatedAt: '2025-06-10',
  },
};

export const mockRoadmaps: Record<string, Roadmap> = {
  u3: {
    id: 'r-u3',
    userId: 'u3',
    generatedAt: '2025-06-11',
    nodes: [
      { id: 'n-c1', courseId: 'c1', tier: 0, status: 'completed' },
      { id: 'n-c2', courseId: 'c2', tier: 0, status: 'completed' },
      { id: 'n-c9', courseId: 'c9', tier: 0, status: 'completed' },
      { id: 'n-c3', courseId: 'c3', tier: 1, status: 'completed' },
      { id: 'n-c4', courseId: 'c4', tier: 1, status: 'current' },
      { id: 'n-c10', courseId: 'c10', tier: 1, status: 'available' },
      { id: 'n-c5', courseId: 'c5', tier: 2, status: 'locked' },
      { id: 'n-c11', courseId: 'c11', tier: 2, status: 'locked' },
    ],
    edges: [
      { from: 'c1', to: 'c3' },
      { from: 'c1', to: 'c4' },
      { from: 'c2', to: 'c4' },
      { from: 'c9', to: 'c10' },
      { from: 'c4', to: 'c5' },
      { from: 'c10', to: 'c11' },
    ],
  },
};

export const mockCompletions: CourseCompletion[] = [
  { id: 'cc1', userId: 'u3', courseId: 'c1', courseTitle: 'Fundamentos de Python', category: 'Ciencia de Datos', skillsUnlocked: ['Python'], completedAt: '2025-06-20' },
  { id: 'cc2', userId: 'u3', courseId: 'c2', courseTitle: 'Estadística para Datos', category: 'Ciencia de Datos', skillsUnlocked: ['Estadística'], completedAt: '2025-07-02' },
  { id: 'cc3', userId: 'u3', courseId: 'c9', courseTitle: 'Finanzas Personales 101', category: 'Finanzas', skillsUnlocked: ['Presupuesto personal'], completedAt: '2025-07-10' },
  { id: 'cc4', userId: 'u3', courseId: 'c3', courseTitle: 'SQL para Análisis', category: 'Ciencia de Datos', skillsUnlocked: ['SQL'], completedAt: '2025-08-05' },
];

export const mockTriviaQuestions: TriviaQuestion[] = [
  { id: 'q1', category: 'Ciencia de Datos', question: '¿Qué técnica se usa para elegir el número óptimo de clusters?', options: ['Regresión lineal', 'Método del codo', 'PCA', 'Gradient Boosting'], correctIndex: 1 },
  { id: 'q2', category: 'Ciencia de Datos', question: '¿Qué mide principalmente la métrica AUC-ROC?', options: ['Velocidad del modelo', 'Capacidad de discriminación entre clases', 'Uso de memoria', 'Tamaño del dataset'], correctIndex: 1 },
  { id: 'q3', category: 'Ciencia de Datos', question: 'En SQL, ¿qué cláusula se usa para filtrar después de un GROUP BY?', options: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'], correctIndex: 1 },
  { id: 'q4', category: 'Finanzas', question: '¿Qué indicador evalúa la capacidad de pago de corto plazo de una empresa?', options: ['Ratio de endeudamiento', 'Liquidez corriente', 'EBITDA', 'ROE'], correctIndex: 1 },
  { id: 'q5', category: 'Finanzas', question: '¿Qué significa DCF en valoración de empresas?', options: ['Direct Cash Flow', 'Discounted Cash Flow', 'Debt Coverage Factor', 'Dividend Cash Fund'], correctIndex: 1 },
  { id: 'q6', category: 'Finanzas', question: '¿Qué representa el EBITDA?', options: ['Utilidad neta', 'Ganancias antes de intereses, impuestos, depreciación y amortización', 'Flujo de caja libre', 'Valor de mercado'], correctIndex: 1 },
  { id: 'q7', category: 'Desarrollo de Software', question: '¿Qué hook de React se usa para efectos secundarios?', options: ['useMemo', 'useEffect', 'useRef', 'useContext'], correctIndex: 1 },
  { id: 'q8', category: 'Desarrollo de Software', question: '¿Qué principio SOLID promueve una sola responsabilidad por clase?', options: ['Open/Closed', 'Single Responsibility', 'Liskov Substitution', 'Dependency Inversion'], correctIndex: 1 },
  { id: 'q9', category: 'Marketing Digital', question: '¿Qué mide el CTR en una campaña digital?', options: ['Costo total', 'Tasa de clics', 'Retorno de inversión', 'Alcance orgánico'], correctIndex: 1, publisherId: 'p2' },
  { id: 'q10', category: 'Marketing Digital', question: '¿Qué técnica mejora el posicionamiento orgánico en buscadores?', options: ['SEM', 'SEO', 'CRM', 'CPM'], correctIndex: 1 },
  { id: 'q11', category: 'Liderazgo', question: '¿Qué estilo de liderazgo delega decisiones al equipo?', options: ['Autocrático', 'Democrático', 'Laissez-faire', 'Transaccional'], correctIndex: 2 },
  { id: 'q12', category: 'Liderazgo', question: '¿Qué modelo describe etapas de formación de un equipo (Tuckman)?', options: ['Forming, Storming, Norming, Performing', 'Plan, Do, Check, Act', 'Input, Process, Output', 'Assess, Design, Build'], correctIndex: 0 },
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
