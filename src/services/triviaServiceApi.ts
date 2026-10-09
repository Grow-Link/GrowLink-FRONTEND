// Cliente REST de trivia-service (crear/consultar salas). El resto del juego
// (unirse, iniciar, responder, y todo lo que llega en vivo) va por STOMP —
// ver triviaSocket.ts. Ninguno de los dos endpoints de aquí pide JWT.

import { authorizedFetch, send, readJson } from './backendSession';
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
  /** Código de la sala de revancha si alguien ya la propuso; null si no hay. */
  revanchaCodigo: string | null;
}

function parseSala(data: any): Sala {
  return {
    id: Number(data?.id),
    codigo: String(data?.codigo ?? ''),
    categoria: categoriaDesdeEnum(String(data?.categoria ?? '')),
    estado: String(data?.estado ?? ''),
    numPreguntas: Number(data?.numPreguntas) as TriviaQuestionCount,
    duracionSegundos: Number(data?.duracionSegundos) as TriviaSecondsPerQuestion,
    revanchaCodigo: data?.revanchaCodigo ?? null,
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

// ---------------------------------------------------------------------------------------------------------
// Historial de competencias: ganadores, mis partidas, salón de la fama
// ---------------------------------------------------------------------------------------------------------

export interface ResumenPartida {
  codigo: string;
  categoria: string;
  numPreguntas: number;
  duracionPreguntaSegundos: number;
  totalJugadores: number;
  ganadorUsuarioId: number | null;
  ganadorNombre: string | null;
  puntosGanador: number;
  empate: boolean;
  duracionTotalSegundos: number;
  finalizadaEn: string;
}

export interface PuestoPartida {
  posicion: number;
  usuarioId: number;
  nombre: string;
  puntos: number;
  aciertos: number;
}

export interface PartidaConPodio {
  partida: ResumenPartida;
  podio: PuestoPartida[];
}

export interface DetallePartida {
  partida: ResumenPartida;
  ranking: PuestoPartida[];
}

export interface MiPartida {
  partida: ResumenPartida;
  miPosicion: number;
  misPuntos: number;
  misAciertos: number;
}

export interface EntradaSalonDeLaFama {
  usuarioId: number;
  nombre: string;
  victorias: number;
  mejorPuntaje: number;
}

function parseResumen(d: any): ResumenPartida {
  return {
    codigo: String(d.codigo),
    categoria: categoriaDesdeEnum(String(d.categoria)),
    numPreguntas: Number(d.numPreguntas),
    duracionPreguntaSegundos: Number(d.duracionPreguntaSegundos),
    totalJugadores: Number(d.totalJugadores),
    ganadorUsuarioId: d.ganadorUsuarioId == null ? null : Number(d.ganadorUsuarioId),
    ganadorNombre: d.ganadorNombre ?? null,
    puntosGanador: Number(d.puntosGanador ?? 0),
    empate: Boolean(d.empate),
    duracionTotalSegundos: Number(d.duracionTotalSegundos ?? 0),
    finalizadaEn: String(d.finalizadaEn),
  };
}

function parsePuesto(d: any): PuestoPartida {
  return {
    posicion: Number(d.posicion),
    usuarioId: Number(d.usuarioId),
    nombre: String(d.nombre),
    puntos: Number(d.puntos),
    aciertos: Number(d.aciertos),
  };
}

async function getTrivia<T>(path: string): Promise<T> {
  const res = await authorizedFetch(() => ({ url: `${TRIVIA_API}${path}` }), SERVICIO);
  return readJson<T>(res, SERVICIO);
}

/** GET /api/partidas/ganadores — las últimas partidas terminadas, cada una con su podio. */
export async function listarGanadores(limite = 20): Promise<PartidaConPodio[]> {
  const data = await getTrivia<any[]>(`/api/partidas/ganadores?limite=${limite}`);
  return data.map((d) => ({ partida: parseResumen(d.partida), podio: (d.podio ?? []).map(parsePuesto) }));
}

/** GET /api/partidas/{codigo} — el acta completa de una partida. */
export async function obtenerPartida(codigo: string): Promise<DetallePartida> {
  const d = await getTrivia<any>(`/api/partidas/${encodeURIComponent(codigo)}`);
  return { partida: parseResumen(d.partida), ranking: (d.ranking ?? []).map(parsePuesto) };
}

/** GET /api/partidas/mias — las partidas en las que participó la persona con sesión. */
export async function listarMisPartidas(limite = 20): Promise<MiPartida[]> {
  const data = await getTrivia<any[]>(`/api/partidas/mias?limite=${limite}`);
  return data.map((d) => ({
    partida: parseResumen(d.partida),
    miPosicion: Number(d.miPosicion),
    misPuntos: Number(d.misPuntos),
    misAciertos: Number(d.misAciertos),
  }));
}

/** GET /api/partidas/salon-de-la-fama — quién ha ganado más partidas. */
export async function salonDeLaFama(limite = 10): Promise<EntradaSalonDeLaFama[]> {
  const data = await getTrivia<any[]>(`/api/partidas/salon-de-la-fama?limite=${limite}`);
  return data.map((d) => ({
    usuarioId: Number(d.usuarioId),
    nombre: String(d.nombre),
    victorias: Number(d.victorias),
    mejorPuntaje: Number(d.mejorPuntaje),
  }));
}

// ---------------------------------------------------------------------------------------------------------
// Retos: "te reto a una trivia"
// ---------------------------------------------------------------------------------------------------------

export type EstadoReto = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'EXPIRADO';

export interface Reto {
  id: number;
  retadorUsuarioId: number;
  retadorNombre: string;
  retadoUsuarioId: number;
  retadoNombre: string;
  categoria: string;
  numPreguntas: TriviaQuestionCount;
  duracionSegundos: TriviaSecondsPerQuestion;
  mensaje: string;
  codigoSala: string;
  estado: EstadoReto;
  creadoEn: string;
  expiraEn: string;
}

function parseReto(d: any): Reto {
  return {
    id: Number(d.id),
    retadorUsuarioId: Number(d.retadorUsuarioId),
    retadorNombre: String(d.retadorNombre),
    retadoUsuarioId: Number(d.retadoUsuarioId),
    retadoNombre: String(d.retadoNombre),
    categoria: categoriaDesdeEnum(String(d.categoria)),
    numPreguntas: Number(d.numPreguntas) as TriviaQuestionCount,
    duracionSegundos: Number(d.duracionSegundos) as TriviaSecondsPerQuestion,
    mensaje: String(d.mensaje ?? ''),
    codigoSala: String(d.codigoSala),
    estado: String(d.estado) as EstadoReto,
    creadoEn: String(d.creadoEn),
    expiraEn: String(d.expiraEn),
  };
}

export interface RetarInput {
  retadoUsuarioId: number;
  retadoNombre: string;
  retadorNombre: string;
  /** Nombre de categoría como lo muestra el frontend. */
  categoria: string;
  numPreguntas: TriviaQuestionCount;
  duracionSegundos: TriviaSecondsPerQuestion;
  mensaje?: string;
}

/** POST /api/retos — crea la sala (quien reta queda esperando adentro) y deja la invitación pendiente. */
export async function retar(input: RetarInput): Promise<Reto> {
  const body = { ...input, categoria: CATEGORIA_ENUM[input.categoria as CategoriaCurso] ?? input.categoria };
  const res = await authorizedFetch(
    () => ({
      url: `${TRIVIA_API}/api/retos`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    }),
    SERVICIO
  );
  return parseReto(await readJson<unknown>(res, SERVICIO));
}

/** GET /api/retos/recibidos — los retos pendientes que todavía no vencen. */
export async function retosRecibidos(): Promise<Reto[]> {
  return (await getTrivia<any[]>('/api/retos/recibidos')).map(parseReto);
}

/** GET /api/retos/enviados — los últimos retos que mandé, con su estado. */
export async function retosEnviados(): Promise<Reto[]> {
  return (await getTrivia<any[]>('/api/retos/enviados')).map(parseReto);
}

async function responderReto(id: number, accion: 'aceptar' | 'rechazar'): Promise<Reto> {
  const res = await authorizedFetch(() => ({ url: `${TRIVIA_API}/api/retos/${id}/${accion}`, init: { method: 'POST' } }), SERVICIO);
  return parseReto(await readJson<unknown>(res, SERVICIO));
}

export interface PreguntaAgregada {
  id: number;
  categoria: string;
  texto: string;
  opciones: string[];
  respuestaCorrecta: number;
}

/** POST /api/preguntas (HU-23) — solo en áreas donde la persona tiene cursos publicados (lo valida el servidor). */
export async function agregarPregunta(input: { categoria: string; texto: string; opciones: string[]; respuestaCorrecta: number }): Promise<PreguntaAgregada> {
  const body = { ...input, categoria: CATEGORIA_ENUM[input.categoria as CategoriaCurso] ?? input.categoria };
  const res = await authorizedFetch(
    () => ({
      url: `${TRIVIA_API}/api/preguntas`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    }),
    SERVICIO
  );
  const d = await readJson<any>(res, SERVICIO);
  return { id: Number(d.id), categoria: categoriaDesdeEnum(String(d.categoria)), texto: String(d.texto), opciones: d.opciones ?? [], respuestaCorrecta: Number(d.respuestaCorrecta) };
}

export const aceptarReto = (id: number) => responderReto(id, 'aceptar');
export const rechazarReto = (id: number) => responderReto(id, 'rechazar');
