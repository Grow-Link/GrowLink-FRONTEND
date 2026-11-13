// Sesión contra los microservicios reales (usuarios-service emite el JWT y
// cursos-service lo valida). Las peticiones van por el proxy de Vite
// (/api-usuarios, /api-cursos, ver vite.config.ts), así no hace falta CORS.
//
// El login ya es real: el usuario se elige en UserSelectPage a partir de
// GET /api/auth/usuarios y la sesión queda guardada aquí (un solo usuario
// activo a la vez, no uno por rol simulado).
//
// Hay dos modos (VITE_AUTH_MODE, ver authMode.ts) y la diferencia entre ellos
// está solo en de dónde sale el token del encabezado Authorization:
//   legacy: del `token` de la sesión guardada (el JWT de usuarios-service).
//   oidc:   de MSAL (ver msalAuth.ts). La sesión guardada sigue existiendo
//           porque las pantallas necesitan id, nombre y rol, pero su `token`
//           queda vacío: el access token lo administra MSAL, no este módulo.

import { esOidc } from './authMode';
import { MicrosoftAuthError, obtenerAccessToken } from './msalAuth';
import { cifrarPeticion, descifrarRespuesta, olvidarLlavesPublicas } from './cifrado';

export const USUARIOS_API = '/api-usuarios';
export const CURSOS_API = '/api-cursos';

// Las unicas direcciones a las que esta app le habla: sus tres servicios, a traves del nginx (o del proxy de Vite). `send` rechaza
// cualquier otra, asi que un dato que llegue de afuera no puede convertirse en una peticion a un sitio ajeno (falsificacion de
// peticiones desde el cliente). /api-trivia vive tambien en triviaServiceApi.ts: se repite aqui para no crear una importacion circular.
const DIRECCIONES_PERMITIDAS = [USUARIOS_API, CURSOS_API, '/api-trivia'] as const;

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

/**
 * Todas las llamadas a los servicios salen por aquí, así que aquí es donde se cifran (ver cifrado.ts): el cuerpo
 * de la petición sale cifrado y la respuesta se descifra antes de entregarla, de modo que quien llama no nota nada.
 * Si el servicio no pudo descifrar la petición (responde 400 sin cifrar: p. ej. se reinició con otra llave) se
 * vuelve a pedir su llave pública y se intenta una vez más.
 */
export async function send(url: string, init: RequestInit | undefined, servicio: string): Promise<Response> {
  if (!DIRECCIONES_PERMITIDAS.some((base) => url.startsWith(`${base}/`))) {
    throw new BackendError(`Direccion no permitida para ${servicio}: solo se llama a los servicios de GrowLink.`);
  }
  for (let intento = 0; ; intento += 1) {
    const peticion = await cifrarPeticion(url, init).catch(() => ({ url, init, llave: null }));
    let res: Response;
    try {
      res = await fetch(peticion.url, peticion.init);
    } catch {
      throw new BackendError(`No se pudo conectar con ${servicio}. ¿Está corriendo?`);
    }
    if (!peticion.llave) return res;
    if (res.status === 400 && res.headers.get('X-GL-Cifrado') !== '1' && intento === 0) {
      olvidarLlavesPublicas();
      continue;
    }
    try {
      return await descifrarRespuesta(res, peticion.llave);
    } catch {
      throw new BackendError(`No se pudo descifrar la respuesta de ${servicio}.`, res.status);
    }
  }
}

/** El mensaje que explica el error (los backends responden { "message": "..." }), o null si no vino. */
async function mensajeDelServidor(res: Response): Promise<string | null> {
  try {
    const cuerpo = await res.clone().json();
    return typeof cuerpo?.message === 'string' && cuerpo.message.trim() ? cuerpo.message : null;
  } catch {
    return null;
  }
}

// Si el proxy de Vite no logra llegar al servicio responde 5xx sin cuerpo JSON.
// Cuando el servicio sí explica el error (400, 409, 422...) ese mensaje es el que le llega a la persona.
export async function readJson<T>(res: Response, servicio: string): Promise<T> {
  if (!res.ok) {
    const mensaje = await mensajeDelServidor(res);
    if (res.status >= 500) throw new BackendError(mensaje ?? `${servicio} no responde (${res.status}). ¿Está corriendo?`, res.status);
    throw new BackendError(mensaje ?? `${servicio} respondió ${res.status}`, res.status);
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

function conAutorizacion(base: HeadersInit | undefined, token: string): Headers {
  const headers = new Headers(base);
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

/**
 * El token que va en `Authorization`, según el modo:
 *  - legacy: el JWT que emitió usuarios-service, guardado en la sesión.
 *  - oidc:   el access token de Microsoft. MSAL lo devuelve de su caché y lo
 *            renueva en silencio cuando le faltan menos de 5 minutos para
 *            vencer, así que no hace falta un temporizador propio: toda
 *            llamada autenticada pasa por aquí.
 */
async function tokenDeAcceso(renovar = false): Promise<string> {
  if (esOidc()) return obtenerAccessToken(renovar);
  const session = getSession();
  if (!session) throw new SessionExpiredError();
  return session.token;
}

/** Borra la sesión y avisa a la UI para que regrese al ingreso. */
function expirarSesion(): never {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  throw new SessionExpiredError();
}

/**
 * fetch con el token del modo activo. No necesita una sesión guardada, así que
 * sirve también para GET /api/usuarios/me, que es justo la llamada que crea la
 * sesión en modo oidc.
 *
 * Si el servicio rechaza el token (401, o 403 — cursos-service responde 403
 * cuando falta o vence) la sesión se borra y se dispara SESSION_EXPIRED_EVENT
 * para que la UI regrese al login, en vez de reintentar en silencio con otra
 * identidad.
 *
 * En modo oidc se intenta UNA vez más antes de rendirse, con un token renovado
 * a la fuerza (puede que el servicio haya rotado sus claves o que el token
 * venciera justo en el camino). Si el token renovado sale igual al que acabó de
 * usarse, el rechazo no era por el token — p. ej. un 403 por falta de permiso —
 * y no se repite la llamada al vacío. En modo legacy nada de esto corre.
 */
export async function bearerFetch(url: string, init: RequestInit = {}, servicio = 'cursos-service'): Promise<Response> {
  let token: string;
  try {
    token = await tokenDeAcceso();
  } catch (err) {
    // falta la sesión de Microsoft: hay que volver a iniciarla. Un error de
    // configuración, en cambio, se muestra tal cual (reintentar no lo arregla).
    if (err instanceof MicrosoftAuthError && err.requiereLogin) expirarSesion();
    throw err;
  }

  const res = await send(url, { ...init, headers: conAutorizacion(init.headers, token) }, servicio);
  if (res.status !== 401 && res.status !== 403) return res;

  if (esOidc()) {
    const renovado = await obtenerAccessToken(true).catch(() => null);
    if (renovado && renovado !== token) {
      const reintento = await send(url, { ...init, headers: conAutorizacion(init.headers, renovado) }, servicio);
      if (reintento.status !== 401 && reintento.status !== 403) return reintento;
    }
  }
  expirarSesion();
}

/** Igual que bearerFetch, pero la petición se arma con los datos de la sesión activa (id del usuario, etc.). */
export async function authorizedFetch(
  build: (session: BackendSession) => AuthorizedRequest,
  servicio = 'cursos-service'
): Promise<Response> {
  const session = getSession();
  if (!session) throw new SessionExpiredError();

  const { url, init } = build(session);
  return bearerFetch(url, init, servicio);
}
