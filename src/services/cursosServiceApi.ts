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
