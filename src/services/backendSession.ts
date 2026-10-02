// Sesión contra los microservicios reales (usuarios-service emite el JWT y
// cursos-service lo valida). Las peticiones van por el proxy de Vite
// (/api-usuarios, /api-cursos, ver vite.config.ts), así no hace falta CORS.
//
// El login ya es real: el usuario se elige en UserSelectPage a partir de
// GET /api/auth/usuarios y la sesión queda guardada aquí (un solo usuario
// activo a la vez, no uno por rol simulado).

export const USUARIOS_API = '/api-usuarios';
export const CURSOS_API = '/api-cursos';

export interface BackendSession {
  token: string;
  usuarioId: number;
  nombre: string;
  rol: string;
  cargo?: string;
}

export class BackendError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
  }
}

/** El token guardado ya no es válido (expiró, o el servicio se reinició con otro secreto). */
export class SessionExpiredError extends Error {
  constructor() {
    super('Tu sesión expiró o ya no es válida. Vuelve a iniciar sesión.');
    this.name = 'SessionExpiredError';
  }
}

const STORAGE_KEY = 'gl_backend_session';

/** Se dispara cuando una llamada autenticada responde 401/403 — quien escuche esto debe volver a la pantalla de login. */
export const SESSION_EXPIRED_EVENT = 'gl:session-expired';

export function getSession(): BackendSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BackendSession) : null;
  } catch {
    return null;
  }
}

export function setSession(session: BackendSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function send(url: string, init: RequestInit | undefined, servicio: string): Promise<Response> {
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

export interface AuthorizedRequest {
  url: string;
  init?: RequestInit;
}

/**
 * fetch con el token de la sesión activa. Si el servicio rechaza el token
 * (401 o 403 — cursos-service responde 403 cuando falta/vence el token) la
 * sesión se borra y se dispara SESSION_EXPIRED_EVENT para que la UI regrese
 * al login, en vez de reintentar en silencio con otra identidad.
 */
export async function authorizedFetch(
  build: (session: BackendSession) => AuthorizedRequest,
  servicio = 'cursos-service'
): Promise<Response> {
  const session = getSession();
  if (!session) throw new SessionExpiredError();

  const { url, init = {} } = build(session);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.token}`);
  const res = await send(url, { ...init, headers }, servicio);

  if (res.status === 401 || res.status === 403) {
    clearSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new SessionExpiredError();
  }
  return res;
}
