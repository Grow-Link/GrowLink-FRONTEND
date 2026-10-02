// Roadmap real de cursos-service para HU-12 (ver utils/roadmapGraph.ts para el grafo).

import type { UserProfile, UserRole } from '../types';
import type { RoadmapCursoInput } from '../utils/roadmapGraph';
import { CATEGORIA_ENUM, type CategoriaCurso } from './cursosServiceApi';
import { authorizedFetch, readJson, CURSOS_API, type BackendSession } from './backendSession';

export interface RoadmapDto {
  id: number;
  usuarioId: number;
  metas: string | null;
  nivel: string;
  creadoEn: string;
  cursos: RoadmapCursoInput[];
}

export interface CursoExterno {
  titulo: string;
  categoria: string;
  nivel: string;
  activo: boolean;
}

export interface RoadmapBackendData {
  session: BackendSession;
  roadmap: RoadmapDto;
  completados: Set<number>;
  inactivos: Set<number>;
  /** Prerequisitos que no quedaron en la ruta, por id. Si alguno no se pudo cargar, simplemente no está. */
  externos: Map<number, CursoExterno>;
}

const SERVICIO = 'cursos-service';

async function getJson<T>(role: UserRole, path: (s: BackendSession) => string): Promise<T> {
  const { res } = await authorizedFetch(role, (s) => ({ url: `${CURSOS_API}${path(s)}` }));
  return readJson<T>(res, SERVICIO);
}

/** El roadmap más reciente del usuario, o null si todavía no tiene (404). */
export async function fetchRoadmap(role: UserRole): Promise<RoadmapBackendData | null> {
  const { res, session } = await authorizedFetch(role, (s) => ({
    url: `${CURSOS_API}/api/roadmap/mio?usuarioId=${s.usuarioId}`,
  }));
  if (res.status === 404) return null;
  const roadmap = await readJson<RoadmapDto>(res, SERVICIO);

  const enRuta = new Set(roadmap.cursos.map((c) => c.cursoId));
  const idsExternos = [...new Set(roadmap.cursos.flatMap((c) => c.prerequisitoIds))].filter((id) => !enRuta.has(id));

  const [completados, estado, externos] = await Promise.all([
    getJson<{ cursoId: number }[]>(role, (s) => `/api/cursos/completados?usuarioId=${s.usuarioId}`),
    enRuta.size > 0
      ? getJson<{ cursoIdsInactivos: number[] }>(role, () => `/api/cursos/estado-roadmap?ids=${[...enRuta].join(',')}`)
      : Promise.resolve({ cursoIdsInactivos: [] }),
    Promise.allSettled(idsExternos.map((id) => getJson<CursoExterno & { id: number }>(role, () => `/api/cursos/${id}`))),
  ]);

  return {
    session,
    roadmap,
    completados: new Set(completados.map((c) => c.cursoId)),
    inactivos: new Set(estado.cursoIdsInactivos),
    externos: new Map(
      externos.flatMap((r) =>
        r.status === 'fulfilled'
          ? [[r.value.id, { titulo: r.value.titulo, categoria: r.value.categoria, nivel: r.value.nivel, activo: r.value.activo }] as const]
          : []
      )
    ),
  };
}

/** HU-11: genera (o regenera) el roadmap con el perfil que el usuario llenó en el frontend. */
export async function generarRoadmap(role: UserRole, profile: UserProfile): Promise<void> {
  const { res } = await authorizedFetch(role, (s) => ({
    url: `${CURSOS_API}/api/roadmap/generar`,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: s.usuarioId,
        metas: profile.goals,
        intereses: profile.interests.map((i) => CATEGORIA_ENUM[i as CategoriaCurso]).filter(Boolean),
        nivel: profile.level.toUpperCase(),
      }),
    },
  }));
  await readJson<RoadmapDto>(res, SERVICIO);
}

const NIVEL_LABEL: Record<string, string> = {
  PRINCIPIANTE: 'Principiante',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
};

export const nivelLabel = (nivel: string) => NIVEL_LABEL[nivel] ?? nivel;
