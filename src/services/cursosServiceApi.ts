// Cliente del backend real cursos-service. Reemplaza los datos inventados que
// usaba antes PublishCoursePage (categorías de ejemplo, habilidades en texto libre
// y la sugerencia de prerequisitos simulada localmente).
//
// cursos-service ya exige el JWT de usuarios-service en estas rutas, así que
// las llamadas van autenticadas por el proxy de Vite (/api-cursos, ver
// vite.config.ts y backendSession.ts) en vez de un fetch directo. Los
// endpoints y la forma de la respuesta de /sugerir-prerequisitos están
// tomados de la especificación que compartiste (Prompt 1); si el contrato
// real difiere, ajusta solo este archivo — la página no necesita cambiar.

import { authorizedFetch, readJson, CURSOS_API } from './backendSession';
import type { Course, Level } from '../types';

const SERVICIO = 'cursos-service';

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

const NIVEL_A_BACKEND: Record<Level, string> = { principiante: 'PRINCIPIANTE', intermedio: 'INTERMEDIO', avanzado: 'AVANZADO' };
const NIVEL_DESDE_BACKEND: Record<string, Level> = { PRINCIPIANTE: 'principiante', INTERMEDIO: 'intermedio', AVANZADO: 'avanzado' };

interface HabilidadBackend {
  id: number;
  nombre: string;
  categoria: string;
}

/**
 * Mapea un CursoResponse de cursos-service al tipo Course del frontend. El
 * backend no manda nombre del publicador ni fecha de creación — se usa un
 * placeholder legible y "ahora" respectivamente, ninguno de los dos se usa
 * para lógica, solo se muestran.
 */
function parseCurso(data: any): Course {
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
  };
}

/** Resuelve nombres de habilidades a sus ids reales, pidiendo de nuevo /api/habilidades para esa categoría (ver nota en crearCurso). */
async function resolveHabilidadIds(categoriaEnum: string, nombres: string[]): Promise<number[]> {
  const res = await authorizedFetch(
    () => ({ url: `${CURSOS_API}/api/habilidades?categoria=${encodeURIComponent(categoriaEnum)}` }),
    SERVICIO
  );
  const data = await readJson<unknown>(res, SERVICIO);
  const raw: HabilidadBackend[] = Array.isArray(data) ? (data as HabilidadBackend[]) : [];
  const nombresSeleccionados = new Set(nombres);
  return raw.filter((h) => nombresSeleccionados.has(h.nombre)).map((h) => h.id);
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

/** GET /api/cursos?publicadorUsuarioId=X — cursos de un publicador específico. */
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

export interface CrearCursoInput {
  titulo: string;
  descripcion: string;
  /** Nombre de categoría como lo muestra el frontend; se convierte al enum del backend aquí. */
  categoria: string;
  nivel: Level;
  /** Nombres de habilidades seleccionadas (no ids — ver nota en resolveHabilidadIds). */
  habilidades: string[];
  linkContenido: string;
  publicadorUsuarioId: number;
  prerequisitoIds: number[];
  /** Entero 1-500, obligatorio. */
  duracionHoras: number;
}

/**
 * POST /api/cursos — crea el curso. CrearCursoRequest pide habilidadIds (los
 * ids reales del catálogo de habilidades), pero getHabilidades() solo expone
 * nombres (lo usa la pantalla para mostrar los chips) — así que acá se vuelve
 * a pedir /api/habilidades para esa categoría y se resuelven los ids por
 * nombre, sin tocar getHabilidades ni su contrato.
 */
export async function crearCurso(input: CrearCursoInput): Promise<Course> {
  const categoriaEnum = CATEGORIA_ENUM[input.categoria as CategoriaCurso] ?? input.categoria;
  const habilidadIds = await resolveHabilidadIds(categoriaEnum, input.habilidades);

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
  nivel: Level;
  /** Nombre de categoría como lo muestra el frontend — se usa solo para resolver habilidadIds, EditarCursoRequest no cambia la categoría del curso. */
  categoria: string;
  habilidades: string[];
  linkContenido: string;
  duracionHoras: number;
}

/** PUT /api/cursos/{id} — edita un curso existente. No se puede cambiar de categoría ni de publicador por esta vía. */
export async function editarCurso(id: string | number, input: EditarCursoInput): Promise<Course> {
  const categoriaEnum = CATEGORIA_ENUM[input.categoria as CategoriaCurso] ?? input.categoria;
  const habilidadIds = await resolveHabilidadIds(categoriaEnum, input.habilidades);

  const body = {
    titulo: input.titulo,
    descripcion: input.descripcion,
    nivel: NIVEL_A_BACKEND[input.nivel],
    habilidadIds,
    linkContenido: input.linkContenido,
    duracionHoras: input.duracionHoras,
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
