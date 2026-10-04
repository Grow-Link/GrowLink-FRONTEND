// HU-24: metricas de concurrencia de trivia-service. Solo el rol ADMIN puede pedirlas
// (el backend lo valida con el rol firmado dentro del JWT).

import { authorizedFetch, readJson } from './backendSession';
import { TRIVIA_API } from './triviaServiceApi';

const SERVICIO = 'trivia-service';

export interface DashboardConcurrencia {
  salasActivas: number;
  salasEnEspera: number;
  salasEnCurso: number;
  participantesConectados: number;
  /** null si todavia no hay respuestas registradas */
  latenciaPromedioMs: number | null;
  empatesResueltos: number;
  partidasFinalizadas: number;
  /** null si todavia no termino ninguna partida */
  duracionPromedioPartidaMs: number | null;
  ventanaMinutos: number | null;
  generadoEn: string;
}

/** GET /api/metricas/dashboard — sin ultimosMinutos cuenta todo lo registrado. */
export async function obtenerDashboardConcurrencia(ultimosMinutos?: number): Promise<DashboardConcurrencia> {
  const qs = ultimosMinutos ? `?ultimosMinutos=${ultimosMinutos}` : '';
  const res = await authorizedFetch(() => ({ url: `${TRIVIA_API}/api/metricas/dashboard${qs}` }), SERVICIO);
  return readJson<DashboardConcurrencia>(res, SERVICIO);
}
