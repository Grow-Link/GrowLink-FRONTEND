import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BackendError,
  SESSION_EXPIRED_EVENT,
  SessionExpiredError,
  authorizedFetch,
  bearerFetch,
  clearSession,
  getSession,
  readJson,
  send,
  setSession,
  type BackendSession,
} from './backendSession';
import { MicrosoftAuthError, obtenerAccessToken } from './msalAuth';
import { jsonResponse, textoResponse } from '../pruebas/datos';
import { simularFetch, simularFetchCaido, simularFetchEnOrden } from '../pruebas/fetchFalso';

// msalAuth habla con Entra ID de verdad: en las pruebas se reemplaza por completo y así se puede decidir qué
// token entrega (o con qué error falla) en cada caso.
vi.mock('./msalAuth', () => ({
  MicrosoftAuthError: class extends Error {
    readonly requiereLogin: boolean;
    constructor(message: string, requiereLogin = false) {
      super(message);
      this.name = 'MicrosoftAuthError';
      this.requiereLogin = requiereLogin;
    }
  },
  obtenerAccessToken: vi.fn(),
}));

const SESION: BackendSession = { token: 'jwt-de-usuarios-service', usuarioId: 7, nombre: 'Mariana', rol: 'USUARIO' };

/** Cuenta cuántas veces se disparó el evento de sesión vencida mientras corre la prueba. */
function escucharSesionVencida(): () => number {
  let veces = 0;
  const onExpired = () => (veces += 1);
  window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
  return () => veces;
}

describe('la sesión guardada', () => {
  it('guarda, lee y borra', () => {
    expect(getSession()).toBeNull();

    setSession(SESION);
    expect(getSession()).toEqual(SESION);

    clearSession();
    expect(getSession()).toBeNull();
  });

  it('devuelve null si lo guardado no es JSON válido, en vez de romper la app', () => {
    sessionStorage.setItem('gl_backend_session', 'esto no es json');

    expect(getSession()).toBeNull();
  });
});

describe('send', () => {
  it('devuelve la respuesta tal cual cuando el servicio contesta', async () => {
    simularFetch(() => jsonResponse({ ok: true }));

    const res = await send('/api-cursos/api/cursos', undefined, 'cursos-service');

    expect(res.status).toBe(200);
  });

  it('convierte un fallo de red en un mensaje que nombra el servicio', async () => {
    simularFetchCaido();

    await expect(send('/api-cursos/x', undefined, 'cursos-service')).rejects.toThrow(
      'No se pudo conectar con cursos-service. ¿Está corriendo?'
    );
  });
});

describe('readJson', () => {
  it('devuelve el cuerpo cuando la respuesta es correcta', async () => {
    await expect(readJson<{ id: number }>(jsonResponse({ id: 3 }), 'cursos-service')).resolves.toEqual({ id: 3 });
  });

  it('usa el mensaje que explica el error cuando el backend lo manda', async () => {
    const res = jsonResponse({ message: 'La meta no es clara' }, 400);

    await expect(readJson(res, 'cursos-service')).rejects.toThrow('La meta no es clara');
  });

  it('en un 5xx sin mensaje sugiere que el servicio no está corriendo', async () => {
    await expect(readJson(textoResponse('', 502), 'trivia-service')).rejects.toThrow(
      'trivia-service no responde (502). ¿Está corriendo?'
    );
  });

  it('en un 4xx sin mensaje dice el código que respondió', async () => {
    await expect(readJson(textoResponse('', 409), 'cursos-service')).rejects.toThrow('cursos-service respondió 409');
  });

  it('conserva el código de estado en el error, para que quien llama pueda distinguirlo', async () => {
    const error: unknown = await readJson(jsonResponse({ message: 'ya existe' }, 409), 'cursos-service').catch((e) => e);

    expect(error).toBeInstanceOf(BackendError);
    expect((error as BackendError).status).toBe(409);
  });

  it('avisa cuando la respuesta correcta no es JSON (el index.html, sin el proxy)', async () => {
    const res = textoResponse('<!doctype html>');

    await expect(readJson(res, 'cursos-service')).rejects.toThrow(/no es JSON.*npm run dev/);
  });
});

describe('authorizedFetch en modo legacy', () => {
  it('manda el token de la sesión en el encabezado Authorization', async () => {
    setSession(SESION);
    const fetchFalso = simularFetch(() => jsonResponse([]));

    await authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }), 'cursos-service');

    expect(fetchFalso.ultima().authorization).toBe('Bearer jwt-de-usuarios-service');
  });

  it('arma la petición con los datos de la sesión', async () => {
    setSession(SESION);
    const fetchFalso = simularFetch(() => jsonResponse([]));

    await authorizedFetch((s) => ({ url: `/api-cursos/api/cursos/completados?usuarioId=${s.usuarioId}` }));

    expect(fetchFalso.ultima().url).toBe('/api-cursos/api/cursos/completados?usuarioId=7');
  });

  it('conserva los encabezados que puso quien llama y agrega el token', async () => {
    setSession(SESION);
    const fetchFalso = simularFetch(() => jsonResponse({}));

    await authorizedFetch(() => ({
      url: '/api-cursos/api/cursos',
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"titulo":"x"}' },
    }));

    const llamada = fetchFalso.ultima();
    expect(llamada.metodo).toBe('POST');
    expect(llamada.cuerpo).toEqual({ titulo: 'x' });
    expect(llamada.authorization).toBe('Bearer jwt-de-usuarios-service');
  });

  it('no llama a nadie si no hay sesión', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({}));

    await expect(authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }))).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fetchFalso.llamadas).toEqual([]);
  });

  it('con un 401 borra la sesión y avisa a la UI', async () => {
    setSession(SESION);
    const veces = escucharSesionVencida();
    simularFetch(() => textoResponse('', 401));

    await expect(authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }))).rejects.toBeInstanceOf(SessionExpiredError);
    expect(getSession()).toBeNull();
    expect(veces()).toBe(1);
  });

  it('hace lo mismo con un 403 (así responde cursos-service cuando el token venció)', async () => {
    setSession(SESION);
    const veces = escucharSesionVencida();
    simularFetch(() => textoResponse('', 403));

    await expect(authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }))).rejects.toBeInstanceOf(SessionExpiredError);
    expect(veces()).toBe(1);
  });

  it('no reintenta: en modo legacy el token no se puede renovar', async () => {
    setSession(SESION);
    const fetchFalso = simularFetch(() => textoResponse('', 401));

    await expect(authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }))).rejects.toThrow();

    expect(fetchFalso.llamadas).toHaveLength(1);
    expect(vi.mocked(obtenerAccessToken)).not.toHaveBeenCalled();
  });

  it('deja pasar un 404 sin tocar la sesión (hay endpoints que lo usan como respuesta normal)', async () => {
    setSession(SESION);
    simularFetch(() => textoResponse('', 404));

    const res = await authorizedFetch(() => ({ url: '/api-cursos/api/roadmap/mio' }));

    expect(res.status).toBe(404);
    expect(getSession()).toEqual(SESION);
  });
});

describe('authorizedFetch en modo oidc', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');
  });

  it('manda el access token de Microsoft, no el de la sesión', async () => {
    setSession({ ...SESION, token: '' });
    vi.mocked(obtenerAccessToken).mockResolvedValue('token-de-microsoft');
    const fetchFalso = simularFetch(() => jsonResponse([]));

    await authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }));

    expect(fetchFalso.ultima().authorization).toBe('Bearer token-de-microsoft');
    // sin forzar renovación: MSAL decide si el de su caché sigue sirviendo
    expect(vi.mocked(obtenerAccessToken)).toHaveBeenCalledWith(false);
  });

  it('ante un 401 reintenta una vez con un token renovado y devuelve esa respuesta', async () => {
    setSession({ ...SESION, token: '' });
    vi.mocked(obtenerAccessToken).mockResolvedValueOnce('token-viejo').mockResolvedValueOnce('token-nuevo');
    const fetchFalso = simularFetchEnOrden([textoResponse('', 401), jsonResponse({ ok: true })]);

    const res = await authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }));

    expect(res.status).toBe(200);
    expect(fetchFalso.llamadas.map((l) => l.authorization)).toEqual(['Bearer token-viejo', 'Bearer token-nuevo']);
    expect(vi.mocked(obtenerAccessToken)).toHaveBeenLastCalledWith(true);
    expect(getSession()).not.toBeNull();
  });

  it('si el reintento también se rechaza, cierra la sesión', async () => {
    setSession({ ...SESION, token: '' });
    const veces = escucharSesionVencida();
    vi.mocked(obtenerAccessToken).mockResolvedValueOnce('token-viejo').mockResolvedValueOnce('token-nuevo');
    const fetchFalso = simularFetchEnOrden([textoResponse('', 401), textoResponse('', 401)]);

    await expect(authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }))).rejects.toBeInstanceOf(SessionExpiredError);

    expect(fetchFalso.llamadas).toHaveLength(2);
    expect(getSession()).toBeNull();
    expect(veces()).toBe(1);
  });

  it('no repite la llamada si el token renovado es el mismo (un 403 de permisos, no de token)', async () => {
    setSession({ ...SESION, token: '' });
    vi.mocked(obtenerAccessToken).mockResolvedValue('el-mismo-token');
    const fetchFalso = simularFetch(() => textoResponse('', 403));

    await expect(authorizedFetch(() => ({ url: '/api-trivia/api/metricas/dashboard' }))).rejects.toBeInstanceOf(
      SessionExpiredError
    );

    expect(fetchFalso.llamadas).toHaveLength(1);
  });

  it('si la sesión de Microsoft venció, cierra la sesión sin llamar al servicio', async () => {
    setSession({ ...SESION, token: '' });
    const veces = escucharSesionVencida();
    vi.mocked(obtenerAccessToken).mockRejectedValue(new MicrosoftAuthError('Tu sesión de Microsoft venció.', true));
    const fetchFalso = simularFetch(() => jsonResponse({}));

    await expect(authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }))).rejects.toBeInstanceOf(SessionExpiredError);

    expect(fetchFalso.llamadas).toEqual([]);
    expect(veces()).toBe(1);
  });

  it('un error de configuración se muestra tal cual y no cierra la sesión', async () => {
    setSession({ ...SESION, token: '' });
    const veces = escucharSesionVencida();
    vi.mocked(obtenerAccessToken).mockRejectedValue(new MicrosoftAuthError('Falta configurar VITE_API_SCOPE.', false));

    await expect(authorizedFetch(() => ({ url: '/api-cursos/api/cursos' }))).rejects.toThrow('Falta configurar VITE_API_SCOPE.');

    expect(getSession()).not.toBeNull();
    expect(veces()).toBe(0);
  });
});

describe('bearerFetch', () => {
  it('en modo oidc funciona sin sesión guardada (es lo que permite preguntar /api/usuarios/me)', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');
    vi.mocked(obtenerAccessToken).mockResolvedValue('token-de-microsoft');
    const fetchFalso = simularFetch(() => jsonResponse({ id: 7 }));

    const res = await bearerFetch('/api-usuarios/api/usuarios/me', undefined, 'usuarios-service');

    expect(res.status).toBe(200);
    expect(getSession()).toBeNull();
    expect(fetchFalso.ultima().authorization).toBe('Bearer token-de-microsoft');
  });

  it('en modo legacy sí necesita la sesión, que es de donde sale el token', async () => {
    await expect(bearerFetch('/api-usuarios/api/usuarios/me', undefined, 'usuarios-service')).rejects.toBeInstanceOf(
      SessionExpiredError
    );
  });
});
