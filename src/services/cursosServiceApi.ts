// Cliente del backend real cursos-service. Reemplaza los datos inventados que
// usaba antes PublishCoursePage (categorías de ejemplo, habilidades en texto libre
// y la sugerencia de prerequisitos simulada localmente).
//
// Ajusta VITE_CURSOS_SERVICE_URL en un .env.local si el servicio no corre en
// http://localhost:8080. Los endpoints y la forma de la respuesta de
// /sugerir-prerequisitos están tomados de la especificación que compartiste
// (Prompt 1); si el contrato real difiere, ajusta solo este archivo — la
// página no necesita cambiar.

const BASE_URL = (import.meta.env.VITE_CURSOS_SERVICE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

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

export interface PrerequisitoSugerido {
  id: string;
  titulo: string;
}

export interface SugerenciaPrerequisitos {
  prerequisitos: PrerequisitoSugerido[];
  modoRespaldo: boolean;
}

async function parseJsonOrThrow(res: Response, label: string) {
  if (!res.ok) {
    throw new Error(`${label} respondió ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    throw new Error(`${label} devolvió una respuesta inválida`);
  }
}

async function request(input: RequestInfo, init: RequestInit | undefined, label: string) {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new Error(`No se pudo conectar con cursos-service (${BASE_URL}). ¿Está corriendo?`);
  }
  return parseJsonOrThrow(res, label);
}

/** GET /api/habilidades?categoria=X — catálogo cerrado de habilidades para esa categoría. */
export async function getHabilidades(categoria: string, signal?: AbortSignal): Promise<string[]> {
  const data = await request(`${BASE_URL}/api/habilidades?categoria=${encodeURIComponent(categoria)}`, { signal }, 'cursos-service /api/habilidades');

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
  const data = await request(
    `${BASE_URL}/api/cursos/sugerir-prerequisitos`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal },
    'cursos-service /api/cursos/sugerir-prerequisitos'
  );

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
