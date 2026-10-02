// Sesión contra los microservicios reales (usuarios-service emite el JWT y
// cursos-service lo valida). Las peticiones van por el proxy de Vite
// (/api-usuarios, /api-cursos, ver vite.config.ts), así no hace falta CORS.
//
// El login del frontend todavía es simulado (SEED_USERS en mockData), así que
// mientras tanto cada usuario simulado se conecta con el usuario de prueba del
// backend que tiene su mismo rol (GET /api/auth/usuarios). Cuando el login real
// exista, basta con reemplazar `login` aquí.

import type { UserRole } from '../types';

export const USUARIOS_API = '/api-usuarios';
export const CURSOS_API = '/api-cursos';

const ROL_BACKEND: Record<UserRole, string> = {
  user: 'USUARIO',
  publisher: 'PUBLICADOR',
  admin: 'ADMIN',
};

export interface BackendSession {
  token: string;
  usuarioId: number;
  nombre: string;
}

export class BackendError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
  }
}

const storageKey = (role: UserRole) => `gl_backend_session_${role}`;

function readStored(role: UserRole): BackendSession | null {
  try {
    const raw = sessionStorage.getItem(storageKey(role));
    return raw ? (JSON.parse(raw) as BackendSession) : null;
  } catch {
    return null;
  }
}

async function send(url: string, init: RequestInit | undefined, servicio: string): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new BackendError(`No se pudo conectar con ${servicio}. ¿Está corriendo?`);
  }
}

// Si el proxy de Vite no logra llegar al servicio responde 5xx sin cuerpo JSON
export async function readJson<T>(res: Response, servicio: string): Promise<T> {
  if (!res.ok) {
    if (res.status >= 500) throw new BackendError(`${servicio} no responde (${res.status}). ¿Está corriendo?`, res.status);
    throw new BackendError(`${servicio} respondió ${res.status}`, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch {
    // p. ej. sin el proxy de Vite, /api-cursos/... devuelve el index.html de la app
    throw new BackendError(`${servicio} devolvió una respuesta que no es JSON. ¿Estás usando npm run dev?`, res.status);
  }
}

async function login(role: UserRole): Promise<BackendSession> {
  const usuarios = await readJson<{ id: number; nombre: string; rol: string }[]>(
    await send(`${USUARIOS_API}/api/auth/usuarios`, undefined, 'usuarios-service'),
    'usuarios-service'
  );
  const usuario = usuarios.find((u) => u.rol === ROL_BACKEND[role]);
  if (!usuario) {
    throw new BackendError(`usuarios-service no tiene un usuario de prueba con rol ${ROL_BACKEND[role]}`);
  }

  const { token } = await readJson<{ token: string }>(
    await send(
      `${USUARIOS_API}/api/auth/login`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuarioId: usuario.id }) },
      'usuarios-service'
    ),
    'usuarios-service'
  );

  const session = { token, usuarioId: usuario.id, nombre: usuario.nombre };
  sessionStorage.setItem(storageKey(role), JSON.stringify(session));
  return session;
}

export async function getBackendSession(role: UserRole): Promise<BackendSession> {
  return readStored(role) ?? login(role);
}

export interface AuthorizedRequest {
  url: string;
  init?: RequestInit;
}

/**
 * fetch con el token del usuario. Si el servicio rechaza el token (expiró, o se
 * reinició con otro GROWLINK_JWT_SECRET) se vuelve a iniciar sesión una vez y se
 * reintenta. cursos-service responde 403 (no 401) cuando falta el token.
 *
 * La petición se arma a partir de la sesión (`build`) para que, si hubo que
 * volver a iniciar sesión, el usuarioId de la URL/body sea el de la sesión nueva.
 */
export async function authorizedFetch(
  role: UserRole,
  build: (session: BackendSession) => AuthorizedRequest,
  servicio = 'cursos-service'
): Promise<{ res: Response; session: BackendSession }> {
  const attempt = async (session: BackendSession) => {
    const { url, init = {} } = build(session);
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${session.token}`);
    return { res: await send(url, { ...init, headers }, servicio), session };
  };

  const first = await attempt(await getBackendSession(role));
  if (first.res.status !== 401 && first.res.status !== 403) return first;
  return attempt(await login(role));
}

