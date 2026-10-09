// Roadmap real de cursos-service: lo que devuelve el servidor se convierte en un "mapa por etapas"
// (ver utils/roadmapModel.ts) con el estado de cada curso según lo que la persona ya aprobó.

import type { Level } from '../types';
import { construirRoadmap, type RoadmapDto, type RoadmapView } from '../utils/roadmapModel';
import { CATEGORIA_ENUM, NIVEL_A_BACKEND, type CategoriaCurso } from './cursosServiceApi';
import { authorizedFetch, getSession, readJson, SessionExpiredError, CURSOS_API } from './backendSession';

const SERVICIO = 'cursos-service';

/** El roadmap más reciente de la persona con sesión, o null si todavía no tiene (404). */
export async function fetchRoadmap(): Promise<RoadmapView | null> {
  const session = getSession();
  if (!session) throw new SessionExpiredError();

  const res = await authorizedFetch((s) => ({ url: `${CURSOS_API}/api/roadmap/mio?usuarioId=${s.usuarioId}` }), SERVICIO);
  if (res.status === 404) return null;
  const roadmap = await readJson<RoadmapDto>(res, SERVICIO);

  const completadosRes = await authorizedFetch(
    (s) => ({ url: `${CURSOS_API}/api/cursos/completados?usuarioId=${s.usuarioId}` }),
    SERVICIO
  );
  const completados = await readJson<{ cursoId: number }[]>(completadosRes, SERVICIO);
  return construirRoadmap(roadmap, new Set(completados.map((c) => c.cursoId)));
}

export interface PerfilParaRoadmap {
  goals: string;
  /** Nombres de categoría como los muestra el frontend. */
  interests: string[];
  level: Level;
}

/**
 * HU-11: genera (o regenera) el roadmap con el perfil de la persona.
 * Si la meta no tiene sentido el servidor responde 400, y si no hay cursos para lo que pide, 422. En los dos
 * casos lanza un BackendError cuyo mensaje ya es el texto que se le muestra a la persona.
 */
export async function generarRoadmap(perfil: PerfilParaRoadmap): Promise<void> {
  const res = await authorizedFetch(
    (s) => ({
      url: `${CURSOS_API}/api/roadmap/generar`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: s.usuarioId,
          metas: perfil.goals,
          intereses: perfil.interests.map((i) => CATEGORIA_ENUM[i as CategoriaCurso] ?? i).filter(Boolean),
          nivel: NIVEL_A_BACKEND[perfil.level],
        }),
      },
    }),
    SERVICIO
  );
  await readJson<RoadmapDto>(res, SERVICIO);
}

const NIVEL_LABEL: Record<string, string> = {
  PRINCIPIANTE: 'Principiante',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
};

export const nivelLabel = (nivel: string) => NIVEL_LABEL[nivel] ?? nivel;
