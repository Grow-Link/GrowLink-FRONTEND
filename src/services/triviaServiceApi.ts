// Cliente REST de trivia-service (crear/consultar salas). El resto del juego
// (unirse, iniciar, responder, y todo lo que llega en vivo) va por STOMP —
// ver triviaSocket.ts. Ninguno de los dos endpoints de aquí pide JWT.

import { send, readJson } from './backendSession';
import { CATEGORIA_ENUM, categoriaDesdeEnum, type CategoriaCurso } from './cursosServiceApi';
import type { TriviaQuestionCount, TriviaSecondsPerQuestion } from '../types';

export const TRIVIA_API = '/api-trivia';
const SERVICIO = 'trivia-service';

export interface Sala {
  id: number;
  codigo: string;
  /** Nombre de categoría como lo muestra el frontend (ya convertido desde el enum del backend). */
  categoria: string;
  estado: string;
  numPreguntas: TriviaQuestionCount;
  duracionSegundos: TriviaSecondsPerQuestion;
}

function parseSala(data: any): Sala {
  return {
    id: Number(data?.id),
    codigo: String(data?.codigo ?? ''),
    categoria: categoriaDesdeEnum(String(data?.categoria ?? '')),
    estado: String(data?.estado ?? ''),
    numPreguntas: Number(data?.numPreguntas) as TriviaQuestionCount,
    duracionSegundos: Number(data?.duracionSegundos) as TriviaSecondsPerQuestion,
  };
}

export interface CrearSalaInput {
  /** Nombre de categoría como lo muestra el frontend; se convierte al enum del backend aquí. */
  categoria: string;
  hostUsuarioId: number;
  hostNombre: string;
  numPreguntas: TriviaQuestionCount;
  duracionSegundos: TriviaSecondsPerQuestion;
}

/** POST /api/salas — crea la sala; quien la crea se vuelve el anfitrión (localmente, no hace falta que el backend lo confirme). */
export async function crearSala(input: CrearSalaInput): Promise<Sala> {
  const body = {
    categoria: CATEGORIA_ENUM[input.categoria as CategoriaCurso] ?? input.categoria,
    hostUsuarioId: input.hostUsuarioId,
    hostNombre: input.hostNombre,
    numPreguntas: input.numPreguntas,
    duracionSegundos: input.duracionSegundos,
  };
  const res = await send(
    `${TRIVIA_API}/api/salas`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    SERVICIO
  );
  return parseSala(await readJson<unknown>(res, SERVICIO));
}

/** GET /api/salas/{codigo} — null si el código no corresponde a ninguna sala (404). */
export async function obtenerSala(codigo: string): Promise<Sala | null> {
  const res = await send(`${TRIVIA_API}/api/salas/${encodeURIComponent(codigo)}`, undefined, SERVICIO);
  if (res.status === 404) return null;
  return parseSala(await readJson<unknown>(res, SERVICIO));
}
