import type { User, Goal, Roadmap, Opportunity, Bid, TriviaQuestion, Player, AdminMetrics, Tematica } from '../types';

export const mockUser: User = {
  id: 'u1',
  name: 'Valentina Ríos',
  email: 'valentina@correo.com',
  role: 'user',
  profileCompletion: 72,
  skills: ['Python', 'Análisis de datos', 'Excel avanzado', 'SQL', 'Power BI'],
  currentIncome: 2800,
  experience: [
    { company: 'Grupo Financiero Norte', role: 'Analista Junior', years: 2, current: true },
    { company: 'StartupMX', role: 'Asistente de Operaciones', years: 1, current: false },
  ],
  education: [
    { institution: 'Universidad Autónoma de Nuevo León', degree: 'Licenciatura en Economía', year: 2021 },
  ],
};

export const mockGoal: Goal = {
  id: 'g1',
  type: 'financial',
  title: 'Duplicar ingreso mensual a $6,000 USD',
  targetAmount: 6000,
  deadline: '2025-12-31',
  currentProgress: 47,
};

export const mockRoadmap: Roadmap = {
  id: 'r1',
  goalId: 'g1',
  generatedAt: '2024-09-01',
  steps: [
    {
      id: 's1',
      order: 1,
      title: 'Certificación en ciencia de datos',
      description: 'Obtén la certificación Google Data Analytics o IBM Data Science para respaldar tu perfil con credenciales reconocidas.',
      estimatedWeeks: 8,
      status: 'completed',
      tags: ['certificación', 'datos'],
    },
    {
      id: 's2',
      order: 2,
      title: 'Construir portafolio en GitHub',
      description: 'Crea 3 proyectos demostrativos: análisis de ventas, dashboard financiero y modelo predictivo con datos reales.',
      estimatedWeeks: 6,
      status: 'in_progress',
      tags: ['portafolio', 'GitHub'],
    },
    {
      id: 's3',
      order: 3,
      title: 'Networking en comunidades de datos',
      description: 'Únete a DataMéxico y LatamDataFest. Presenta un proyecto en algún meetup para construir visibilidad.',
      estimatedWeeks: 4,
      status: 'pending',
      tags: ['networking', 'comunidad'],
    },
    {
      id: 's4',
      order: 4,
      title: 'Postular a roles Senior / Data Analyst',
      description: 'Con el portafolio y red activa, postula a roles con rango salarial de $4,500–$7,000 USD. GrowLink te hace el match.',
      estimatedWeeks: 6,
      status: 'pending',
      tags: ['empleo', 'match'],
    },
    {
      id: 's5',
      order: 5,
      title: 'Negociación y cierre de oferta',
      description: 'Técnicas de negociación salarial para maximizar la oferta. Incluye taller práctico con simulación de entrevistas.',
      estimatedWeeks: 2,
      status: 'pending',
      tags: ['negociación', 'salario'],
    },
  ],
};

export const mockOpportunities: Opportunity[] = [
  {
    id: 'o1',
    type: 'course',
    title: 'Machine Learning aplicado a finanzas con Python',
    description: 'Aprende a construir modelos predictivos para mercados financieros, gestión de riesgo crediticio y detección de fraude. Instructores con experiencia en fondos de inversión reales.',
    provider: { id: 'p1', name: 'DataFinance Academy', rating: 4.9, reviewCount: 312, verified: true },
    price: 890,
    originalPrice: 1400,
    spotsLeft: 8,
    totalSpots: 30,
    isAuction: false,
    tags: ['Python', 'ML', 'Finanzas', 'Datos'],
    matchScore: 97,
    featured: true,
  },
  {
    id: 'o2',
    type: 'job',
    title: 'Data Analyst Senior — Fintech Scale-up',
    description: 'Posición remota en empresa fintech Series B. Stack: Python, dbt, Looker. Rango salarial: $5,200–$7,000 USD.',
    provider: { id: 'p2', name: 'Kapital Technologies', rating: 4.7, reviewCount: 48, verified: true },
    price: 0,
    spotsLeft: 2,
    totalSpots: 2,
    isAuction: false,
    tags: ['Python', 'dbt', 'Remoto', 'Serie B'],
    matchScore: 91,
    isLive: true,
  },
  {
    id: 'o3',
    type: 'service',
    title: 'Mentoría 1:1 con Director de Datos — Banca',
    description: 'Sesiones mensuales con un CDO de institución financiera top 5. Orientación de carrera, revisión de portafolio y preparación para entrevistas ejecutivas.',
    provider: { id: 'p3', name: 'CareerElite', rating: 5.0, reviewCount: 127, verified: true },
    price: 0,
    isAuction: true,
    auctionEndsAt: '2024-09-15T18:00:00Z',
    currentBid: 340,
    tags: ['Mentoría', 'Carrera', 'Finanzas'],
    matchScore: 88,
    isLive: true,
  },
  {
    id: 'o4',
    type: 'course',
    title: 'Power BI avanzado: storytelling con datos',
    description: 'De reportes estáticos a dashboards interactivos que influyen en decisiones. Incluye 8 casos reales de empresas Fortune 500.',
    provider: { id: 'p4', name: 'Nexo Digital', rating: 4.6, reviewCount: 203, verified: false },
    price: 290,
    spotsLeft: 15,
    totalSpots: 40,
    isAuction: false,
    tags: ['Power BI', 'Datos', 'Business Intelligence'],
    matchScore: 84,
  },
  {
    id: 'o5',
    type: 'job',
    title: 'Analista de Riesgo Crediticio — Banco Regional',
    description: 'Rol presencial en CDMX. Manejo de modelos de scoring, scorecard development y validación de modelos. Sueldo base: $3,500 USD.',
    provider: { id: 'p5', name: 'Banco Región', rating: 4.3, reviewCount: 19, verified: true },
    price: 0,
    spotsLeft: 4,
    totalSpots: 4,
    isAuction: false,
    tags: ['Riesgo', 'Banca', 'CDMX'],
    matchScore: 79,
  },
  {
    id: 'o6',
    type: 'course',
    title: 'SQL para analistas: de cero a consultas complejas',
    description: 'Fundamentos sólidos y técnicas avanzadas: CTEs, window functions, optimización de queries. 40 ejercicios con datasets reales.',
    provider: { id: 'p6', name: 'QueryMaster', rating: 4.8, reviewCount: 891, verified: true },
    price: 120,
    spotsLeft: 45,
    totalSpots: 100,
    isAuction: false,
    tags: ['SQL', 'Bases de datos', 'Análisis'],
    matchScore: 76,
  },
];

export const mockBids: Bid[] = [
  { id: 'b1', userId: 'u5', userName: 'Carlos M.', amount: 340, timestamp: '14:32:01', isLeading: true },
  { id: 'b2', userId: 'u8', userName: 'Sofía P.', amount: 320, timestamp: '14:31:44', isLeading: false },
  { id: 'b3', userId: 'u3', userName: 'Rodrigo V.', amount: 300, timestamp: '14:31:22', isLeading: false },
  { id: 'b4', userId: 'u12', userName: 'Lucía F.', amount: 280, timestamp: '14:30:58', isLeading: false },
  { id: 'b5', userId: 'u7', userName: 'Diego N.', amount: 260, timestamp: '14:30:31', isLeading: false },
];

export const mockTriviaQuestions: TriviaQuestion[] = [
  {
    id: 'q1',
    question: '¿Cuál es el principal indicador que evalúa la capacidad de pago de corto plazo de una empresa?',
    options: ['Ratio de endeudamiento', 'Ratio de liquidez corriente', 'EBITDA', 'ROE'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    question: 'En machine learning, ¿qué técnica se usa para seleccionar el número óptimo de clusters?',
    options: ['Regresión lineal', 'Método del codo (Elbow method)', 'PCA', 'Gradient Boosting'],
    correctIndex: 1,
  },
  {
    id: 'q3',
    question: '¿Qué significa ROI en el contexto de inversión financiera?',
    options: ['Rate of Income', 'Return on Investment', 'Risk Operational Index', 'Revenue Over Inflation'],
    correctIndex: 1,
  },
];

export const mockPlayers: Player[] = [
  { id: 'p1', name: 'Valentina R.', score: 2400, streak: 3, isCurrentUser: true, position: 1 },
  { id: 'p2', name: 'Marco A.', score: 2200, streak: 2, position: 2 },
  { id: 'p3', name: 'Sofía L.', score: 1900, streak: 1, position: 3 },
  { id: 'p4', name: 'Diego C.', score: 1700, streak: 0, position: 4 },
  { id: 'p5', name: 'Ana M.', score: 1500, streak: 2, position: 5 },
  { id: 'p6', name: 'Luis R.', score: 1200, streak: 0, position: 6 },
];

export const mockAdminMetrics: AdminMetrics = {
  activeUsers: 14832,
  userGrowthPercent: 23.4,
  goalAchievementRate: 61.2,
  avgIncome: 4150,
  totalOpportunities: 847,
  monthlyData: [
    { month: 'Mar', users: 8200, completions: 410, revenue: 148000 },
    { month: 'Abr', users: 9400, completions: 510, revenue: 172000 },
    { month: 'May', users: 10100, completions: 590, revenue: 189000 },
    { month: 'Jun', users: 11300, completions: 680, revenue: 210000 },
    { month: 'Jul', users: 12800, completions: 790, revenue: 241000 },
    { month: 'Ago', users: 14200, completions: 910, revenue: 278000 },
    { month: 'Sep', users: 14832, completions: 1020, revenue: 312000 },
  ],
};

export const mockTematicas: Tematica[] = [
  { id: 't1', name: 'Ciencia de Datos', description: 'Cursos y empleos relacionados con análisis, ML e inteligencia artificial', opportunityCount: 142, isActive: true, createdAt: '2024-01-15', category: 'Tecnología' },
  { id: 't2', name: 'Finanzas Personales', description: 'Herramientas para gestión de presupuesto, inversión y ahorro', opportunityCount: 89, isActive: true, createdAt: '2024-01-20', category: 'Finanzas' },
  { id: 't3', name: 'Liderazgo Ejecutivo', description: 'Habilidades directivas, gestión de equipos y toma de decisiones', opportunityCount: 67, isActive: true, createdAt: '2024-02-03', category: 'Management' },
  { id: 't4', name: 'Marketing Digital', description: 'SEO, paid media, analytics y growth hacking', opportunityCount: 104, isActive: true, createdAt: '2024-02-14', category: 'Marketing' },
  { id: 't5', name: 'Desarrollo de Software', description: 'Backend, frontend, DevOps y arquitectura de sistemas', opportunityCount: 198, isActive: true, createdAt: '2024-02-28', category: 'Tecnología' },
  { id: 't6', name: 'Emprendimiento', description: 'Validación de ideas, fundraising y escalamiento de startups', opportunityCount: 43, isActive: false, createdAt: '2024-03-10', category: 'Negocios' },
  { id: 't7', name: 'Idiomas para Negocios', description: 'Inglés, portugués y mandarín aplicados al entorno laboral', opportunityCount: 55, isActive: true, createdAt: '2024-03-22', category: 'Habilidades' },
  { id: 't8', name: 'Diseño UX/UI', description: 'Investigación de usuarios, prototipado y sistemas de diseño', opportunityCount: 61, isActive: false, createdAt: '2024-04-05', category: 'Tecnología' },
];
