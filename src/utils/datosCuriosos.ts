// Los datos curiosos que cuenta el personaje al terminar un curso. Son hechos de historia y ciencia que no caducan
// (nada de "noticias" que cambian o que alguien tendría que vigilar), escritos a mano. Se buscan por el título del
// curso; los cursos que publiquen otras personas y no estén aquí usan los datos de su área.

import type { RoadmapNode } from './roadmapModel';

const quitarTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const POR_CURSO: Record<string, string[]> = {
  'Fundamentos de Programación': [
    'Ada Lovelace escribió en 1843 lo que se considera el primer algoritmo pensado para una máquina: la Máquina Analítica de Babbage.',
    'La palabra «bug» se popularizó en 1947, cuando operadores del Harvard Mark II encontraron una polilla atrapada en un relé y la pegaron en su bitácora.',
  ],
  'Python desde Cero': [
    'Python no se llama así por la serpiente: Guido van Rossum lo bautizó en honor al grupo de comedia Monty Python.',
    'La primera versión pública de Python salió en 1991.',
  ],
  'Bases de Datos Relacionales': [
    'El modelo relacional lo propuso Edgar F. Codd en 1970, cuando trabajaba en IBM.',
    'SQL nació en IBM en los años setenta y su primer nombre fue SEQUEL.',
  ],
  'Redes de Computadores': [
    'El primer mensaje por ARPANET, en 1969, iba a ser «LOGIN», pero el sistema se cayó después de las letras «LO».',
    'Tim Berners-Lee propuso la World Wide Web en 1989, mientras trabajaba en el CERN.',
  ],
  'Programación Orientada a Objetos': [
    'Simula, creado en Noruega en los años sesenta, fue el primer lenguaje con clases y objetos.',
    'Alan Kay, creador de Smalltalk, ha dicho que la idea central de los objetos son los mensajes que se envían entre sí.',
  ],
  'Python Intermedio: Datos y Automatización': [
    'pandas, la librería más usada para datos en Python, la empezó Wes McKinney en 2008 mientras trabajaba en finanzas.',
    'Si escribes «import this» en Python aparece El Zen de Python, con principios como «lo simple es mejor que lo complejo».',
  ],
  'Estructuras de Datos y Algoritmos': [
    'El algoritmo de Euclides para hallar el máximo común divisor tiene más de 2.000 años y todavía se usa.',
    'Edsger Dijkstra contó que ideó su algoritmo de caminos mínimos en unos 20 minutos, sin papel, sentado en un café.',
  ],
  'Desarrollo Web Backend': [
    'El primer sitio web, publicado en el CERN, todavía se puede visitar en info.cern.ch.',
    'REST, el estilo con el que se diseñan casi todas las APIs web, lo definió Roy Fielding en su tesis doctoral del año 2000.',
  ],
  'Análisis de Datos con Python': [
    'John Tukey, que popularizó el análisis exploratorio de datos, también acuñó la palabra «bit».',
    'Florence Nightingale usó gráficos de áreas polares en el siglo XIX para convencer al gobierno británico de mejorar los hospitales militares.',
  ],
  'Computación en la Nube y DevOps': [
    'Amazon lanzó el almacenamiento S3 en 2006, uno de los pilares de la nube tal como la conocemos.',
    'La palabra DevOps se popularizó con el primer DevOpsDays, en Bélgica, en 2009.',
  ],
  'Arquitectura de Software': [
    'Los patrones de diseño se hicieron populares con un libro de 1994 escrito por cuatro autores conocidos como la «Banda de los Cuatro».',
    'La ley de Conway (1967) dice que las organizaciones diseñan sistemas que copian su propia forma de comunicarse.',
  ],
  'Python Avanzado: APIs, Pruebas y Concurrencia': [
    'En la implementación estándar de Python, el GIL impide que dos hilos ejecuten código Python a la vez; por eso la concurrencia suele resolverse con procesos o con asyncio.',
    'Las anotaciones de tipos llegaron a Python con el PEP 484, en 2015.',
  ],
  'Inteligencia Artificial y Aprendizaje Automático': [
    'El término «inteligencia artificial» se usó por primera vez en el taller de Dartmouth, en 1956.',
    'En 1997 Deep Blue, de IBM, venció en un match al campeón mundial de ajedrez Garry Kasparov.',
  ],
  'Sistemas Distribuidos y Concurrencia': [
    'Dijkstra planteó en 1965 el problema de «los filósofos cenando» para explicar cómo los procesos se pueden bloquear entre sí.',
    'En 1978 Leslie Lamport mostró cómo ordenar eventos en sistemas que no comparten un reloj; años después ganó el premio Turing.',
  ],
  'Matemáticas Discretas': [
    'La teoría de grafos nació en 1736, cuando Euler resolvió el problema de los siete puentes de Königsberg.',
    'George Boole publicó su álgebra de la lógica en 1854, y es la base de los circuitos digitales.',
  ],
  'Cálculo Diferencial': [
    'Newton y Leibniz desarrollaron el cálculo por separado en el siglo XVII, y su disputa por el crédito fue famosa.',
    'La notación dy/dx que usas hoy la introdujo Leibniz.',
  ],
  'Cálculo Integral': [
    'Arquímedes calculó áreas y volúmenes hace más de 2.000 años con una idea que anticipaba la integral.',
    'El símbolo ∫ es una «S» alargada, de la palabra latina summa; la eligió Leibniz.',
  ],
  'Probabilidad y Estadística': [
    'La teoría de la probabilidad nació en el siglo XVII, de una correspondencia entre Pascal y Fermat sobre juegos de azar.',
    '«Student» fue el seudónimo de William Gosset, que inventó la prueba t mientras trabajaba en la cervecería Guinness.',
  ],
  'Álgebra Lineal Aplicada': [
    'El PageRank de los inicios de Google se apoya en vectores propios de una matriz gigantesca: la de los enlaces de la web.',
    'Cada vez que rotas un modelo 3D en pantalla, tu equipo multiplica matrices.',
  ],
  'Contabilidad para no Contadores': [
    'Luca Pacioli describió la contabilidad por partida doble en 1494, por eso se le llama el padre de la contabilidad.',
    'En la partida doble cada movimiento se anota en dos cuentas, y por eso el balance siempre tiene que cuadrar.',
  ],
  'Finanzas para la Toma de Decisiones': [
    'El valor del dinero en el tiempo, la idea de que hoy vale más que mañana, está detrás de casi toda decisión financiera.',
    'Harry Markowitz propuso en 1952 la teoría moderna de portafolios: diversificar para reducir el riesgo. Ganó el Nobel en 1990.',
  ],
  'Gestión de Proyectos Ágiles': [
    'El Manifiesto Ágil se redactó en 2001, en una reunión de 17 personas en Utah.',
    'Scrum toma su nombre del rugby: la melé, donde todo el equipo avanza junto con el balón.',
  ],
  'Liderazgo de Equipos Técnicos': [
    'El Proyecto Aristóteles de Google encontró que la seguridad psicológica fue el factor que más distinguía a los equipos más efectivos.',
    'Amy Edmondson, de Harvard, popularizó el concepto de seguridad psicológica tras estudiar equipos de hospitales.',
  ],
  'Emprendimiento e Innovación': [
    'Instagram empezó como Burbn, una app de check-ins, y un cambio de rumbo la convirtió en la red de fotos que conocemos.',
    'La idea de «producto mínimo viable» la popularizó Eric Ries con el libro The Lean Startup, en 2011.',
  ],
  'Inglés Técnico A2': [
    'Cerca de la mitad de los sitios web están en inglés, y por eso es el idioma de casi toda la documentación técnica.',
    'La palabra «computer» designaba originalmente a personas que hacían cálculos a mano.',
  ],
  'Inglés para el Trabajo B1': [
    'En inglés de oficina «let’s touch base» significa ponerse al día brevemente; la expresión viene del béisbol.',
    'El inglés es el idioma más usado como segunda lengua en el mundo.',
  ],
  'Inglés Profesional B2': [
    'En muchas reuniones internacionales, quienes hablan inglés como segunda lengua son más que quienes lo tienen de lengua materna.',
    'Con un vocabulario de unas pocas miles de palabras se entiende buena parte de lo que se lee a diario.',
  ],
  'Escritura Académica y Profesional': [
    'La palabra «bibliografía» viene del griego: biblíon (libro) y graphía (escritura).',
    'El formato IMRyD (Introducción, Métodos, Resultados y Discusión) es la estructura estándar de los artículos científicos.',
  ],
  'Gestión de Procesos': [
    'Frederick Taylor publicó en 1911 «Principios de la administración científica», uno de los primeros estudios sobre cómo mejorar procesos.',
    'Con la línea de montaje en movimiento, Ford pasó de más de 12 horas por Modelo T a poco más de 90 minutos.',
  ],
  'Control de Calidad': [
    'W. Edwards Deming ayudó a reconstruir la industria japonesa después de la Segunda Guerra Mundial con control estadístico de la calidad.',
    'Los gráficos de control los inventó Walter Shewhart en los años veinte, en los Laboratorios Bell.',
  ],
  'Lean Manufacturing y Mejora Continua': [
    'Lean viene del Sistema de Producción de Toyota, y «kaizen» significa mejora continua.',
    'Taiichi Ohno creó el kanban en Toyota inspirándose en cómo los supermercados reponen lo que se vende.',
  ],
  'Logística y Cadena de Suministro': [
    'Cerca del 80 % del comercio mundial de mercancías, en volumen, viaja por mar.',
    'Malcolm McLean popularizó el contenedor estándar en 1956 y abarató el transporte de carga en todo el mundo.',
  ],
};

const POR_AREA: Record<string, string[]> = {
  'Ingeniería de Sistemas': ['El primer transistor se demostró en 1947 en los Laboratorios Bell, y hoy un procesador tiene miles de millones.'],
  Matemáticas: ['El cero como número, tal como lo usamos hoy, se desarrolló en la India y llegó a Europa a través del mundo árabe.'],
  'Administración de Empresas': ['La contabilidad por partida doble se describió por escrito en 1494 y sigue siendo la base de los libros de cualquier empresa.'],
  Idiomas: ['El español es la segunda lengua materna más hablada del mundo, después del chino mandarín.'],
  'Ingeniería Industrial': ['Henry Ford redujo el tiempo de ensamblaje de un Modelo T de más de 12 horas a poco más de 90 minutos con la línea de montaje.'],
  'Ingeniería Civil': ['El Panteón de Roma tiene la cúpula de hormigón sin refuerzo más grande del mundo, y lleva casi 1.900 años en pie.'],
  'Ingeniería Electrónica': ['El primer transistor se demostró en 1947 en los Laboratorios Bell.'],
  'Ingeniería Mecánica': ['De James Watt, que perfeccionó la máquina de vapor, viene el nombre de la unidad de potencia: el vatio.'],
  'Ingeniería Ambiental': ['La capa de ozono se ha ido recuperando desde el Protocolo de Montreal, firmado en 1987.'],
  Derecho: ['El Código de Hammurabi, de hace unos 3.700 años, es una de las primeras colecciones de leyes escritas.'],
};

const INDICE = new Map(Object.entries(POR_CURSO).map(([titulo, datos]) => [quitarTildes(titulo), datos]));

/** Los datos curiosos de un curso: los suyos si los tiene y, si no, los de su área. Puede devolver una lista vacía. */
export function datosDe(nodo: Pick<RoadmapNode, 'titulo' | 'categoria'>): string[] {
  return INDICE.get(quitarTildes(nodo.titulo)) ?? POR_AREA[nodo.categoria] ?? [];
}

// ---- inglés: el personaje lo usa solo si en la ruta hay cursos de inglés --------------------------------------------

export interface FraseIngles {
  en: string;
  es: string;
}

export const FRASES_INGLES = {
  aprobo: [
    { en: 'Well done, you passed this course.', es: 'Bien hecho, aprobaste este curso.' },
    { en: 'One more step, you are getting closer.', es: 'Un paso más, cada vez estás más cerca.' },
  ] as FraseIngles[],
  saludo: [
    { en: 'Ready when you are.', es: 'Cuando quieras empezamos.' },
    { en: 'What are we learning today?', es: '¿Qué vamos a aprender hoy?' },
  ] as FraseIngles[],
  bloqueado: [{ en: 'You need to finish the previous course first.', es: 'Primero necesitas terminar el curso anterior.' }] as FraseIngles[],
};

export function estudiaIngles(nodos: RoadmapNode[]): boolean {
  return nodos.some((n) => /idiomas/i.test(n.categoria) || /ingl[eé]s|english/i.test(n.titulo));
}
