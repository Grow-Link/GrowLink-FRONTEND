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
