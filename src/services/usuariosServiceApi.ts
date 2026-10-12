// Cliente de usuarios-service: usuarios semilla, login real y perfil (metas,
// intereses, nivel) que decide qué variante del Home se muestra.
//
// Contrato confirmado contra /v3/api-docs de usuarios-service en localhost:8080
// (no es una suposición): GET /api/perfil/me (no /api/perfil), PUT
// /api/perfil/{metas,intereses,nivel}, GET /api/home/estado con un enum
// `estado` (no banderas booleanas), y POST /api/auth/login que además del
// token devuelve el `usuario` ya resuelto.

import { USUARIOS_API, authorizedFetch, clearSession, readJson, send, setSession, type BackendSession } from './backendSession';
import { CATEGORIA_ENUM, categoriaDesdeEnum, type CategoriaCurso } from './cursosServiceApi';
import type { Level, UserRole } from '../types';

const SERVICIO = 'usuarios-service';

export interface UsuarioQuemado {
  id: number;
  nombre: string;
  rol: string;
  cargo?: string;
}

const ROL_A_UI: Record<string, UserRole> = {
  USUARIO: 'user',
  PUBLICADOR: 'publisher',
  ADMIN: 'admin',
};

export function rolDesdeBackend(rol: string): UserRole {
  return ROL_A_UI[rol] ?? 'user';
}

function parseUsuario(data: any): UsuarioQuemado {
  return {
    id: Number(data?.id),
    nombre: String(data?.nombre ?? ''),
    rol: String(data?.rol ?? 'USUARIO'),
    cargo: data?.cargo ?? undefined,
  };
}

/** GET /api/auth/usuarios — usuarios semilla disponibles para el login de demostración. */
export async function getUsuariosQuemados(): Promise<UsuarioQuemado[]> {
  const res = await send(`${USUARIOS_API}/api/auth/usuarios`, undefined, SERVICIO);
  const data = await readJson<unknown>(res, SERVICIO);
  return Array.isArray(data) ? data.map(parseUsuario) : [];
}

/** POST /api/auth/login — inicia sesión como el usuario elegido y guarda el JWT. */
export async function login(usuario: UsuarioQuemado): Promise<BackendSession> {
  const res = await send(
    `${USUARIOS_API}/api/auth/login`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuarioId: usuario.id }) },
    SERVICIO
  );
  const data = await readJson<{ token: string; usuario?: unknown }>(res, SERVICIO);
  // La respuesta trae el usuario ya resuelto por el backend; si por algo no viniera, cae al que eligió la UI.
  const resuelto = data.usuario ? parseUsuario(data.usuario) : usuario;
  const session: BackendSession = { token: data.token, usuarioId: resuelto.id, nombre: resuelto.nombre, rol: resuelto.rol, cargo: resuelto.cargo };
  setSession(session);
  return session;
}

export function logout(): void {
  clearSession();
}

export interface Perfil {
  metas: string | null;
  /** Nombres de categoría como los muestra el frontend (ya convertidos desde el enum del backend). */
  intereses: string[];
  nivel: Level | null;
  completo: boolean;
  /** HU-22: partidas de trivia ganadas, la suma trivia-service cuando termina una partida. */
  triviasGanadas: number;
  /** El tiempo que puede dedicarle (opcional: los dos o ninguno). Con eso el roadmap no se pasa de horas. */
  horasPorSemana: number | null;
  semanas: number | null;
}

const NIVEL_DESDE_BACKEND: Record<string, Level> = { PRINCIPIANTE: 'principiante', INTERMEDIO: 'intermedio', AVANZADO: 'avanzado' };

function parsePerfil(data: any): Perfil {
  const intereses = Array.isArray(data?.intereses) ? data.intereses : [];
  return {
    metas: data?.metas ?? null,
    intereses: intereses.map((i: string) => categoriaDesdeEnum(i)),
    nivel: data?.nivel ? NIVEL_DESDE_BACKEND[data.nivel] ?? null : null,
    completo: Boolean(data?.completo),
    triviasGanadas: Number(data?.triviasGanadas ?? 0),
    horasPorSemana: typeof data?.horasPorSemana === 'number' ? data.horasPorSemana : null,
    semanas: typeof data?.semanas === 'number' ? data.semanas : null,
  };
}

async function perfilRequest(path: string, body: unknown): Promise<Perfil> {
  const res = await authorizedFetch(
    () => ({
      url: `${USUARIOS_API}/api/perfil/${path}`,
      init: { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    }),
    SERVICIO
  );
  return parsePerfil(await readJson<unknown>(res, SERVICIO));
}

/** GET /api/perfil/me — metas, intereses y nivel guardados del usuario autenticado. */
export async function getPerfil(): Promise<Perfil> {
  const res = await authorizedFetch(() => ({ url: `${USUARIOS_API}/api/perfil/me` }), SERVICIO);
  return parsePerfil(await readJson<unknown>(res, SERVICIO));
}

/** PUT /api/perfil/metas */
export async function guardarMetas(texto: string): Promise<Perfil> {
  return perfilRequest('metas', { metas: texto });
}

/** PUT /api/perfil/intereses — recibe nombres de categoría como los muestra el frontend y los convierte al enum del backend. */
export async function guardarIntereses(categorias: string[]): Promise<Perfil> {
  const intereses = categorias.map((c) => CATEGORIA_ENUM[c as CategoriaCurso]).filter(Boolean);
  return perfilRequest('intereses', { intereses });
}

/** PUT /api/perfil/nivel */
export async function guardarNivel(nivel: Level): Promise<Perfil> {
  return perfilRequest('nivel', { nivel: nivel.toUpperCase() });
}

/** PUT /api/perfil/tiempo — horas por semana y plazo en semanas; sin valores se quita el límite. */
export async function guardarTiempo(horasPorSemana: number | null, semanas: number | null): Promise<Perfil> {
  return perfilRequest('tiempo', horasPorSemana && semanas ? { horasPorSemana, semanas } : {});
}

export type EstadoHomeTipo = 'SIN_PERFIL' | 'CON_PERFIL_SIN_ROADMAP' | 'CON_ROADMAP';

export interface EstadoHome {
  estado: EstadoHomeTipo;
  secciones: string[];
}

/** GET /api/home/estado — qué variante del Home mostrar y qué secciones son visibles según el rol. */
export async function getEstadoHome(): Promise<EstadoHome> {
  const res = await authorizedFetch(() => ({ url: `${USUARIOS_API}/api/home/estado` }), SERVICIO);
  const data = await readJson<any>(res, SERVICIO);
  return {
    estado: (data?.estado ?? 'SIN_PERFIL') as EstadoHomeTipo,
    secciones: Array.isArray(data?.secciones) ? data.secciones : [],
  };
}

/** Nombre de cada persona por id (para mostrar «Publicado por Beto Ramírez» en vez de un número). */
export async function nombresDePersonas(): Promise<Map<string, string>> {
  try {
    const usuarios = await getUsuariosQuemados();
    return new Map(usuarios.map((u) => [String(u.id), u.nombre]));
  } catch {
    return new Map();
  }
}

export interface PersonaBuscada {
  id: number;
  nombre: string;
  rol: string;
  cargo?: string;
  triviasGanadas: number;
}

// ---------------------------------------------------------------------------------------------------------
// Jardín: una semilla por roadmap completado, una gota por trivia ganada. Todo el estado vive en
// usuarios-service — no hay nada de esto en localStorage ni en datos de mentira.
//
// Este endpoint todavía se está construyendo en usuarios-service en paralelo: el contrato de abajo es el
// acordado, no uno confirmado contra /v3/api-docs (a diferencia del resto de este archivo). Si cambia algo
// al conectar de verdad, lo que hay que ajustar es parseSemilla/parsePlanta/parseJardin.
// ---------------------------------------------------------------------------------------------------------

export type EtapaPlanta = 'SEMILLA' | 'BROTE' | 'PLANTA' | 'FLORECIDA';

export interface SemillaJardin {
  id: number;
  /** Nombre de categoría como lo muestra el frontend (ya convertido desde el enum del backend). */
  categoria: string;
  roadmapId: number;
  titulo: string;
  obtenidaEn: string;
}

export interface PlantaJardin {
  id: number;
  categoria: string;
  roadmapId: number;
  espacio: number;
  riegos: number;
  riegosNecesarios: number;
  etapa: EtapaPlanta;
  plantadaEn: string;
  florecidaEn: string | null;
}

export interface Jardin {
  gotas: number;
  espacios: number;
  /** Semillas que todavía no se plantaron. */
  semillas: SemillaJardin[];
  plantas: PlantaJardin[];
}

function parseSemilla(d: any): SemillaJardin {
  return {
    id: Number(d?.id),
    categoria: categoriaDesdeEnum(String(d?.categoria ?? '')),
    roadmapId: Number(d?.roadmapId),
    titulo: String(d?.titulo ?? ''),
    obtenidaEn: String(d?.obtenidaEn ?? ''),
  };
}

function parsePlanta(d: any): PlantaJardin {
  return {
    id: Number(d?.id),
    categoria: categoriaDesdeEnum(String(d?.categoria ?? '')),
    roadmapId: Number(d?.roadmapId),
    espacio: Number(d?.espacio),
    riegos: Number(d?.riegos ?? 0),
    riegosNecesarios: Number(d?.riegosNecesarios ?? 3),
    etapa: (d?.etapa ?? 'SEMILLA') as EtapaPlanta,
    plantadaEn: String(d?.plantadaEn ?? ''),
    florecidaEn: d?.florecidaEn ?? null,
  };
}

function parseJardin(d: any): Jardin {
  return {
    gotas: Number(d?.gotas ?? 0),
    espacios: Number(d?.espacios ?? 6),
    semillas: Array.isArray(d?.semillas) ? d.semillas.map(parseSemilla) : [],
    plantas: Array.isArray(d?.plantas) ? d.plantas.map(parsePlanta) : [],
  };
}

/** GET /api/jardin — además de leer el estado, sincroniza semillas nuevas desde los roadmaps que ya se completaron. */
export async function obtenerJardin(): Promise<Jardin> {
  const res = await authorizedFetch(() => ({ url: `${USUARIOS_API}/api/jardin` }), SERVICIO);
  return parseJardin(await readJson<unknown>(res, SERVICIO));
}

/** POST /api/jardin/plantas/{id}/plantar — planta una semilla en un espacio libre del jardín (400/404/409 con mensaje). */
export async function plantarSemilla(semillaId: number, espacio: number): Promise<PlantaJardin> {
  const res = await authorizedFetch(
    () => ({
      url: `${USUARIOS_API}/api/jardin/plantas/${semillaId}/plantar`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ espacio }) },
    }),
    SERVICIO
  );
  return parsePlanta(await readJson<unknown>(res, SERVICIO));
}

export interface RiegoResultado {
  gotas: number;
  planta: PlantaJardin;
}

/** POST /api/jardin/plantas/{id}/regar — gasta una gota; 409 si no hay gotas o si la planta ya está florecida. */
export async function regarPlanta(plantaId: number): Promise<RiegoResultado> {
  const res = await authorizedFetch(
    () => ({ url: `${USUARIOS_API}/api/jardin/plantas/${plantaId}/regar`, init: { method: 'POST' } }),
    SERVICIO
  );
  const d = await readJson<any>(res, SERVICIO);
  return { gotas: Number(d?.gotas ?? 0), planta: parsePlanta(d?.planta) };
}

/** GET /api/usuarios/buscar?q= — busca personas por nombre o cargo (mínimo 2 letras, máximo 10 resultados). */
export async function buscarPersonas(texto: string, signal?: AbortSignal): Promise<PersonaBuscada[]> {
  const q = texto.trim();
  if (q.length < 2) return [];
  const res = await authorizedFetch(
    () => ({ url: `${USUARIOS_API}/api/usuarios/buscar?q=${encodeURIComponent(q)}`, init: { signal } }),
    SERVICIO
  );
  const data = await readJson<any[]>(res, SERVICIO);
  return (Array.isArray(data) ? data : []).map((u) => ({
    id: Number(u.id),
    nombre: String(u.nombre ?? ''),
    rol: String(u.rol ?? 'USUARIO'),
    cargo: u.cargo ?? undefined,
    triviasGanadas: Number(u.triviasGanadas ?? 0),
  }));
}
