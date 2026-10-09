// Cliente del backend real cursos-service: catálogo, detalle, publicar/editar, áreas disponibles y exámenes.
//
// cursos-service exige el JWT de usuarios-service en estas rutas, así que las llamadas van autenticadas por
// el proxy de Vite (/api-cursos, ver vite.config.ts y backendSession.ts). Si el contrato real difiere, se
// ajusta solo este archivo — las páginas no necesitan cambiar.

import { authorizedFetch, readJson, CURSOS_API } from './backendSession';
import type { Course, Level } from '../types';

const SERVICIO = 'cursos-service';

// Estas 10 categorías son el enum cerrado de los tres backends (usuarios, cursos y trivia). Cuáles de ellas
// TIENEN cursos hoy no sale de aquí sino de /api/cursos/resumen (ver listarAreas).
export const CATEGORIAS_CURSOS = [
  'Ingeniería de Sistemas',
  'Ingeniería Civil',
  'Ingeniería Industrial',
  'Ingeniería Electrónica',
  'Ingeniería Mecánica',
  'Ingeniería Ambiental',
  'Matemáticas',
  'Administración de Empresas',
  'Idiomas',
  'Derecho',
] as const;

export type CategoriaCurso = (typeof CATEGORIAS_CURSOS)[number];

/** Nombre del enum `Categoria` de cursos-service para cada categoría que muestra el frontend. */
export const CATEGORIA_ENUM: Record<CategoriaCurso, string> = {
  'Ingeniería de Sistemas': 'INGENIERIA_SISTEMAS',
  'Ingeniería Civil': 'INGENIERIA_CIVIL',
  'Ingeniería Industrial': 'INGENIERIA_INDUSTRIAL',
  'Ingeniería Electrónica': 'INGENIERIA_ELECTRONICA',
  'Ingeniería Mecánica': 'INGENIERIA_MECANICA',
  'Ingeniería Ambiental': 'INGENIERIA_AMBIENTAL',
  Matemáticas: 'MATEMATICAS',
  'Administración de Empresas': 'ADMINISTRACION_EMPRESAS',
  Idiomas: 'IDIOMAS',
  Derecho: 'DERECHO',
};

/** Inverso de CATEGORIA_ENUM; si llega un valor desconocido se devuelve tal cual. */
export function categoriaDesdeEnum(valor: string): string {
  const entry = Object.entries(CATEGORIA_ENUM).find(([, e]) => e === valor);
  return entry ? entry[0] : valor;
}

export const NIVEL_A_BACKEND: Record<Level, string> = { principiante: 'PRINCIPIANTE', intermedio: 'INTERMEDIO', avanzado: 'AVANZADO' };
export const NIVEL_DESDE_BACKEND: Record<string, Level> = { PRINCIPIANTE: 'principiante', INTERMEDIO: 'intermedio', AVANZADO: 'avanzado' };

interface HabilidadBackend {
  id: number;
  nombre: string;
  categoria: string;
}

/**
 * Mapea un CursoResponse de cursos-service al tipo Course del frontend. El backend no manda nombre del
 * publicador ni fecha de creación — se usa un texto legible y "ahora", ninguno se usa para lógica.
 */
export function parseCurso(data: any): Course {
  const habilidades: HabilidadBackend[] = Array.isArray(data?.habilidades) ? data.habilidades : [];
  const prerequisitoIds: unknown[] = Array.isArray(data?.prerequisitoIds) ? data.prerequisitoIds : [];
  return {
    id: String(data?.id),
    title: String(data?.titulo ?? ''),
    description: String(data?.descripcion ?? ''),
    category: categoriaDesdeEnum(String(data?.categoria ?? '')),
    level: NIVEL_DESDE_BACKEND[data?.nivel] ?? 'principiante',
    skills: habilidades.map((h) => h.nombre),
    contentUrl: String(data?.linkContenido ?? ''),
    prerequisites: prerequisitoIds.map(String),
    publisherId: String(data?.publicadorUsuarioId ?? ''),
    publisherName: `Publicador #${data?.publicadorUsuarioId ?? '?'}`,
    status: data?.activo ? 'active' : 'inactive',
    createdAt: new Date().toISOString(),
    durationHours: typeof data?.duracionHoras === 'number' ? data.duracionHoras : null,
    syllabus: Array.isArray(data?.temario) ? data.temario.map(String) : [],
    examQuestions: Number(data?.totalPreguntasExamen ?? 0),
  };
}

/** GET /api/cursos — catálogo completo (o filtrado por categoría/nivel si se pasan). */
export async function listarCatalogo(categoria?: string, nivel?: Level): Promise<Course[]> {
  const params = new URLSearchParams();
  if (categoria) params.set('categoria', CATEGORIA_ENUM[categoria as CategoriaCurso] ?? categoria);
  if (nivel) params.set('nivel', NIVEL_A_BACKEND[nivel]);
  const qs = params.toString();
  const res = await authorizedFetch(() => ({ url: `${CURSOS_API}/api/cursos${qs ? `?${qs}` : ''}` }), SERVICIO);
  const data = await readJson<unknown>(res, SERVICIO);
  return Array.isArray(data) ? data.map(parseCurso) : [];
}

/** GET /api/cursos?publicadorUsuarioId=X — cursos de un publicador específico (incluye los dados de baja). */
export async function listarPorPublicador(publicadorUsuarioId: number): Promise<Course[]> {
  const res = await authorizedFetch(
    () => ({ url: `${CURSOS_API}/api/cursos?publicadorUsuarioId=${publicadorUsuarioId}` }),
    SERVICIO
  );
  const data = await readJson<unknown>(res, SERVICIO);
  return Array.isArray(data) ? data.map(parseCurso) : [];
}

/** GET /api/cursos/{id} — un curso puntual; null si no existe (404). */
export async function obtenerCurso(id: string | number): Promise<Course | null> {
  const res = await authorizedFetch(() => ({ url: `${CURSOS_API}/api/cursos/${id}` }), SERVICIO);
  if (res.status === 404) return null;
  return parseCurso(await readJson<unknown>(res, SERVICIO));
}

// ---------------------------------------------------------------------------------------------------------
// Áreas disponibles (lo que se muestra antes de pedir la meta)
// ---------------------------------------------------------------------------------------------------------

export interface AreaResumen {
  /** Enum del backend (INGENIERIA_SISTEMAS). */
  area: string;
  /** Nombre para mostrar (Ingeniería de Sistemas). */
  etiqueta: string;
  cursos: number;
  horasTotales: number;
  principiante: number;
  intermedio: number;
  avanzado: number;
  habilidades: string[];
  ejemplos: string[];
}

/** GET /api/cursos/resumen — las áreas que tienen cursos activos AHORA, con sus números reales. */
export async function listarAreas(): Promise<AreaResumen[]> {
  const res = await authorizedFetch(() => ({ url: `${CURSOS_API}/api/cursos/resumen` }), SERVICIO);
  const data = await readJson<any[]>(res, SERVICIO);
  return (Array.isArray(data) ? data : []).map((a) => ({
    area: String(a.area),
    etiqueta: String(a.etiqueta ?? categoriaDesdeEnum(String(a.area))),
    cursos: Number(a.cursos ?? 0),
    horasTotales: Number(a.horasTotales ?? 0),
    principiante: Number(a.principiante ?? 0),
    intermedio: Number(a.intermedio ?? 0),
    avanzado: Number(a.avanzado ?? 0),
    habilidades: Array.isArray(a.habilidades) ? a.habilidades.map(String) : [],
    ejemplos: Array.isArray(a.ejemplos) ? a.ejemplos.map(String) : [],
  }));
}

// ---------------------------------------------------------------------------------------------------------
// Exámenes: la única forma de completar un curso
// ---------------------------------------------------------------------------------------------------------

export interface PreguntaExamen {
  id: number;
  enunciado: string;
  opciones: string[];
}

export interface Examen {
  cursoId: number;
  titulo: string;
  minimoAprobacion: number;
  yaCompletado: boolean;
  preguntas: PreguntaExamen[];
}

export interface ResultadoExamen {
  aprobado: boolean;
  aciertos: number;
  total: number;
  porcentaje: number;
  minimoAprobacion: number;
  cursoCompletado: boolean;
}

/** GET /api/cursos/{id}/examen — las preguntas y opciones (el servidor nunca manda cuál es la correcta). */
export async function obtenerExamen(cursoId: string | number): Promise<Examen> {
  const res = await authorizedFetch(() => ({ url: `${CURSOS_API}/api/cursos/${cursoId}/examen` }), SERVICIO);
  const data = await readJson<any>(res, SERVICIO);
  return {
    cursoId: Number(data.cursoId),
    titulo: String(data.titulo ?? ''),
    minimoAprobacion: Number(data.minimoAprobacion ?? 70),
    yaCompletado: Boolean(data.yaCompletado),
    preguntas: (Array.isArray(data.preguntas) ? data.preguntas : []).map((p: any) => ({
      id: Number(p.id),
      enunciado: String(p.enunciado),
      opciones: Array.isArray(p.opciones) ? p.opciones.map(String) : [],
    })),
  };
}

/** POST /api/cursos/{id}/examen — manda las respuestas (índice elegido por pregunta, -1 si la dejó en blanco). */
export async function presentarExamen(cursoId: string | number, respuestas: number[]): Promise<ResultadoExamen> {
  const res = await authorizedFetch(
    () => ({
      url: `${CURSOS_API}/api/cursos/${cursoId}/examen`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ respuestas }) },
    }),
    SERVICIO
  );
  return readJson<ResultadoExamen>(res, SERVICIO);
}

export interface CursoCompletado {
  cursoId: number;
  titulo: string;
  categoria: string;
  nivel: Level;
  habilidades: string[];
  fechaCompletado: string;
  disponible: boolean;
}

/** GET /api/cursos/completados — historial del usuario con sesión (incluye cursos ya dados de baja). */
export async function listarCompletados(usuarioId: number): Promise<CursoCompletado[]> {
  const res = await authorizedFetch(() => ({ url: `${CURSOS_API}/api/cursos/completados?usuarioId=${usuarioId}` }), SERVICIO);
  const data = await readJson<any[]>(res, SERVICIO);
  return (Array.isArray(data) ? data : []).map((c) => ({
    cursoId: Number(c.cursoId),
    titulo: String(c.titulo),
    categoria: categoriaDesdeEnum(String(c.categoria)),
    nivel: NIVEL_DESDE_BACKEND[c.nivel] ?? 'principiante',
    habilidades: Array.isArray(c.habilidades) ? c.habilidades.map((h: any) => String(h.nombre)) : [],
    fechaCompletado: String(c.fechaCompletado),
    disponible: Boolean(c.disponible),
  }));
}

// ---------------------------------------------------------------------------------------------------------
// Publicar y editar
// ---------------------------------------------------------------------------------------------------------

export interface PreguntaExamenInput {
  enunciado: string;
  /** Siempre 4 opciones. */
  opciones: string[];
  /** Índice (0 a 3) de la opción correcta. */
  respuestaCorrecta: number;
}

export interface CrearCursoInput {
  titulo: string;
  descripcion: string;
  /** Nombre de categoría como lo muestra el frontend; se convierte al enum del backend aquí. */
  categoria: string;
  nivel: Level;
  /** Nombres de habilidades seleccionadas (no ids — ver nota abajo). */
  habilidades: string[];
  linkContenido: string;
  publicadorUsuarioId: number;
  prerequisitoIds: number[];
  duracionHoras: number;
  temario: string[];
  examen: PreguntaExamenInput[];
}

async function resolverHabilidadIds(categoriaEnum: string, nombres: string[]): Promise<number[]> {
  const res = await authorizedFetch(
    () => ({ url: `${CURSOS_API}/api/habilidades?categoria=${encodeURIComponent(categoriaEnum)}` }),
    SERVICIO
  );
  const data = await readJson<unknown>(res, SERVICIO);
  const raw: HabilidadBackend[] = Array.isArray(data) ? (data as HabilidadBackend[]) : [];
  const seleccionadas = new Set(nombres);
  return raw.filter((h) => seleccionadas.has(h.nombre)).map((h) => h.id);
}

/**
 * POST /api/cursos — crea el curso. CrearCursoRequest pide habilidadIds (los ids reales del catálogo de
 * habilidades), pero la pantalla maneja nombres, así que acá se resuelven los ids por nombre.
 */
export async function crearCurso(input: CrearCursoInput): Promise<Course> {
  const categoriaEnum = CATEGORIA_ENUM[input.categoria as CategoriaCurso] ?? input.categoria;
  const habilidadIds = await resolverHabilidadIds(categoriaEnum, input.habilidades);

  const body = {
    titulo: input.titulo,
    descripcion: input.descripcion,
    categoria: categoriaEnum,
    nivel: NIVEL_A_BACKEND[input.nivel],
    habilidadIds,
    linkContenido: input.linkContenido,
    publicadorUsuarioId: input.publicadorUsuarioId,
    prerequisitoIds: input.prerequisitoIds,
    duracionHoras: input.duracionHoras,
    temario: input.temario,
    examen: input.examen,
  };
  const res = await authorizedFetch(
    () => ({
      url: `${CURSOS_API}/api/cursos`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    }),
    SERVICIO
  );
  return parseCurso(await readJson<unknown>(res, SERVICIO));
}

export interface EditarCursoInput {
  titulo: string;
  descripcion: string;
  /** La categoría no cambia al editar, pero hace falta para resolver los ids de habilidades. */
  categoria: string;
  nivel: Level;
  habilidades: string[];
  linkContenido: string;
  duracionHoras: number;
  temario: string[];
  /** Si no se manda, el examen que ya tiene el curso se conserva tal cual. */
  examen?: PreguntaExamenInput[];
}

/** PUT /api/cursos/{id} — solo el dueño del curso o un ADMIN. */
export async function editarCurso(id: string | number, input: EditarCursoInput): Promise<Course> {
  const categoriaEnum = CATEGORIA_ENUM[input.categoria as CategoriaCurso] ?? input.categoria;
  const habilidadIds = await resolverHabilidadIds(categoriaEnum, input.habilidades);
  const body = {
    titulo: input.titulo,
    descripcion: input.descripcion,
    nivel: NIVEL_A_BACKEND[input.nivel],
    habilidadIds,
    linkContenido: input.linkContenido,
    duracionHoras: input.duracionHoras,
    temario: input.temario,
    ...(input.examen ? { examen: input.examen } : {}),
  };
  const res = await authorizedFetch(
    () => ({
      url: `${CURSOS_API}/api/cursos/${id}`,
      init: { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    }),
    SERVICIO
  );
  return parseCurso(await readJson<unknown>(res, SERVICIO));
}

/** PUT /api/cursos/{id}/prerequisitos — reemplaza los prerrequisitos del curso (dueño o ADMIN). */
export async function actualizarPrerequisitos(id: string | number, prerequisitoIds: number[]): Promise<void> {
  const res = await authorizedFetch(
    () => ({
      url: `${CURSOS_API}/api/cursos/${id}/prerequisitos`,
      init: { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prerequisitoIds }) },
    }),
    SERVICIO
  );
  await readJson<unknown>(res, SERVICIO);
}

/** PATCH /api/cursos/{id}/baja — baja lógica: sale del catálogo y deja de recomendarse en los roadmaps nuevos. */
export async function darDeBajaCurso(id: string | number): Promise<void> {
  const res = await authorizedFetch(() => ({ url: `${CURSOS_API}/api/cursos/${id}/baja`, init: { method: 'PATCH' } }), SERVICIO);
  if (!res.ok) await readJson<unknown>(res, SERVICIO);
}

export interface PrerequisitoSugerido {
  id: string;
  titulo: string;
}

export interface SugerenciaPrerequisitos {
  prerequisitos: PrerequisitoSugerido[];
  modoRespaldo: boolean;
}

/** GET /api/habilidades?categoria=X — catálogo cerrado de habilidades para esa categoría. */
export async function getHabilidades(categoria: string, signal?: AbortSignal): Promise<string[]> {
  // cursos-service espera el enum (INGENIERIA_SISTEMAS), no el nombre que muestra el frontend —
  // si se manda el nombre tal cual, Spring no puede convertirlo y responde 403, no 400.
  const categoriaEnum = CATEGORIA_ENUM[categoria as CategoriaCurso] ?? categoria;
  const res = await authorizedFetch(
    () => ({ url: `${CURSOS_API}/api/habilidades?categoria=${encodeURIComponent(categoriaEnum)}`, init: { signal } }),
    SERVICIO
  );
  const data = await readJson<any>(res, SERVICIO);

  const raw = Array.isArray(data) ? data : Array.isArray(data?.habilidades) ? data.habilidades : [];
  return raw.map((item: unknown) => (typeof item === 'string' ? item : (item as any)?.nombre ?? (item as any)?.habilidad ?? String(item)));
}

/**
 * POST /api/cursos/sugerir-prerequisitos — sugerencia de prerequisitos para un curso nuevo.
 * Cuando el servicio de IA no está disponible, cursos-service responde en modo de
 * respaldo (reglas simples por categoría/nivel) y lo señala en `modoRespaldo`.
 */
export async function sugerirPrerequisitos(
  input: { categoria: string; nivel: string; titulo: string },
  signal?: AbortSignal
): Promise<SugerenciaPrerequisitos> {
  // Mismo caso que getHabilidades: categoria y nivel van como el enum del backend, no como se muestran en la UI.
  const body = {
    ...input,
    categoria: CATEGORIA_ENUM[input.categoria as CategoriaCurso] ?? input.categoria,
    nivel: input.nivel.toUpperCase(),
  };
  const res = await authorizedFetch(
    () => ({
      url: `${CURSOS_API}/api/cursos/sugerir-prerequisitos`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal },
    }),
    SERVICIO
  );
  const data = await readJson<any>(res, SERVICIO);

  const raw = Array.isArray(data?.prerequisitos) ? data.prerequisitos : Array.isArray(data) ? data : [];
  const prerequisitos: PrerequisitoSugerido[] = raw.map((item: unknown) => {
    if (typeof item === 'string') return { id: item, titulo: item };
    const o = item as any;
    const id = o?.id ?? o?.cursoId ?? o?.titulo ?? o?.nombre;
    const titulo = o?.titulo ?? o?.nombre ?? id;
    return { id: String(id), titulo: String(titulo) };
  });

  const modoRespaldo = Boolean(data?.modoRespaldo ?? data?.fallback ?? data?.sinIA ?? true);
  return { prerequisitos, modoRespaldo };
}
