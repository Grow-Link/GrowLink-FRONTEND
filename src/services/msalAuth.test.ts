import { beforeEach, describe, expect, it, vi } from 'vitest';

// @azure/msal-browser habla con Entra ID de verdad (ventanas emergentes, redirecciones y red). Aquí se
// reemplaza por un doble que registra con qué configuración se creó y qué se le pidió, para poder revisar lo
// que de verdad importa: que el flujo sea el correcto y que los errores lleguen traducidos.
const { app, creado, Errores } = vi.hoisted(() => {
  /** Como los errores de MSAL: lo que los identifica es su `errorCode`. */
  class ErrorDeMsal extends Error {
    constructor(
      readonly errorCode: string,
      readonly errorMessage: string = ''
    ) {
      super(errorMessage);
    }
  }
  return {
    app: {
      initialize: vi.fn(),
      handleRedirectPromise: vi.fn(),
      getActiveAccount: vi.fn(),
      getAllAccounts: vi.fn(),
      setActiveAccount: vi.fn(),
      acquireTokenSilent: vi.fn(),
      loginPopup: vi.fn(),
      loginRedirect: vi.fn(),
      clearCache: vi.fn(),
    },
    creado: { configuraciones: [] as any[], importaciones: { veces: 0 } },
    Errores: { DeMsal: ErrorDeMsal },
  };
});

vi.mock('@azure/msal-browser', () => {
  creado.importaciones.veces += 1;
  return {
    // una clase de verdad (no un vi.fn): se usa con `new` y devuelve siempre el mismo doble
    PublicClientApplication: class {
      constructor(configuracion: unknown) {
        creado.configuraciones.push(configuracion);
        return app as never;
      }
    },
    LogLevel: { Error: 1 },
  };
});

const CUENTA = { homeAccountId: 'abc', username: 'mariana@ejemplo.test' } as any;

/** El módulo recién importado: guarda la instancia de MSAL en memoria, así que cada prueba empieza de cero. */
async function cargarMsalAuth() {
  vi.resetModules();
  return import('./msalAuth');
}

function configurarEntorno(over: Record<string, string> = {}) {
  vi.stubEnv('VITE_AUTH_MODE', 'oidc');
  vi.stubEnv('VITE_AZURE_CLIENT_ID', 'cliente-123');
  vi.stubEnv('VITE_AZURE_AUTHORITY', 'https://login.microsoftonline.com/tenant-123');
  vi.stubEnv('VITE_API_SCOPE', 'api://growlink/acceso');
  for (const [clave, valor] of Object.entries(over)) vi.stubEnv(clave, valor);
}

beforeEach(() => {
  creado.configuraciones.length = 0;
  app.initialize.mockResolvedValue(undefined);
  app.handleRedirectPromise.mockResolvedValue(null);
  app.getActiveAccount.mockReturnValue(CUENTA);
  app.getAllAccounts.mockReturnValue([]);
  app.clearCache.mockResolvedValue(undefined);
  app.loginRedirect.mockResolvedValue(undefined);
});

describe('configuración', () => {
  it('arma MSAL con el cliente y la autoridad de las variables de entorno', async () => {
    configurarEntorno();
    const { msal } = await cargarMsalAuth();

    await msal();

    expect(creado.configuraciones[0]).toMatchObject({
      auth: { clientId: 'cliente-123', authority: 'https://login.microsoftonline.com/tenant-123' },
    });
  });

  it('guarda sus tokens en sessionStorage y los renueva 5 minutos antes de que venzan', async () => {
    configurarEntorno();
    const { msal } = await cargarMsalAuth();

    await msal();

    expect(creado.configuraciones[0]).toMatchObject({
      cache: { cacheLocation: 'sessionStorage' },
      system: { tokenRenewalOffsetSeconds: 300, loggerOptions: { logLevel: 1 } },
    });
  });

  it('usa el origen de la app como redirect URI', async () => {
    configurarEntorno();
    const { msal } = await cargarMsalAuth();

    await msal();

    expect(creado.configuraciones[0].auth.redirectUri).toBe(`${window.location.origin}/redirect.html`);
  });

  it('explica qué variable falta en vez de fallar con un error de MSAL', async () => {
    configurarEntorno({ VITE_AZURE_CLIENT_ID: '' });
    const { msal, MicrosoftAuthError } = await cargarMsalAuth();

    const error = await msal().catch((e) => e);

    expect(error).toBeInstanceOf(MicrosoftAuthError);
    expect(error.message).toMatch(/VITE_AZURE_CLIENT_ID y VITE_AZURE_AUTHORITY/);
    // no es algo que se arregle volviendo a iniciar sesión
    expect(error.requiereLogin).toBe(false);
  });

  it('avisa si falta el scope del API', async () => {
    configurarEntorno({ VITE_API_SCOPE: '' });
    const { obtenerAccessToken } = await cargarMsalAuth();

    await expect(obtenerAccessToken()).rejects.toThrow(/VITE_API_SCOPE/);
  });

  it('acepta varios scopes separados por espacios o comas', async () => {
    configurarEntorno({ VITE_API_SCOPE: 'api://growlink/acceso, api://growlink/lectura' });
    app.acquireTokenSilent.mockResolvedValue({ accessToken: 't' });
    const { obtenerAccessToken } = await cargarMsalAuth();

    await obtenerAccessToken();

    expect(app.acquireTokenSilent).toHaveBeenCalledWith(
      expect.objectContaining({ scopes: ['api://growlink/acceso', 'api://growlink/lectura'] })
    );
  });

  it('inicializa MSAL una sola vez aunque se le pida muchas veces', async () => {
    configurarEntorno();
    const { msal } = await cargarMsalAuth();

    await Promise.all([msal(), msal(), msal()]);

    expect(app.initialize).toHaveBeenCalledTimes(1);
  });

  it('reintenta la creación si la primera vez falló, en vez de quedarse con el fallo', async () => {
    configurarEntorno({ VITE_AZURE_CLIENT_ID: '' });
    const { msal } = await cargarMsalAuth();
    await expect(msal()).rejects.toThrow();

    configurarEntorno();
    await expect(msal()).resolves.toBe(app);
  });
});

describe('la vuelta del login por redirección', () => {
  it('deja activa la cuenta con la que se acaba de autenticar', async () => {
    configurarEntorno();
    app.handleRedirectPromise.mockResolvedValue({ account: CUENTA });
    const { msal } = await cargarMsalAuth();

    await msal();

    expect(app.setActiveAccount).toHaveBeenCalledWith(CUENTA);
  });

  it('si no hay cuenta activa pero MSAL recuerda una, la adopta', async () => {
    configurarEntorno();
    app.getActiveAccount.mockReturnValue(null);
    app.getAllAccounts.mockReturnValue([CUENTA]);
    const { msal } = await cargarMsalAuth();

    await msal();

    expect(app.setActiveAccount).toHaveBeenCalledWith(CUENTA);
  });

  it('sin ninguna cuenta no inventa una sesión', async () => {
    configurarEntorno();
    app.getActiveAccount.mockReturnValue(null);
    const { cuentaActiva } = await cargarMsalAuth();

    await expect(cuentaActiva()).resolves.toBeNull();
    expect(app.setActiveAccount).not.toHaveBeenCalled();
  });
});

describe('cuentaActiva', () => {
  it('en modo legacy no toca MSAL siquiera', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'legacy');
    const { cuentaActiva } = await cargarMsalAuth();

    await expect(cuentaActiva()).resolves.toBeNull();
    expect(app.initialize).not.toHaveBeenCalled();
  });

  it('en modo legacy la librería no se llega a descargar (va por import dinámico)', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'legacy');
    const antes = creado.importaciones.veces;
    const { cuentaActiva, cerrarSesionMicrosoft } = await cargarMsalAuth();

    await cuentaActiva();
    await cerrarSesionMicrosoft();

    expect(creado.importaciones.veces).toBe(antes);
  });

  it('en modo oidc devuelve la cuenta con sesión abierta', async () => {
    configurarEntorno();
    const { cuentaActiva } = await cargarMsalAuth();

    await expect(cuentaActiva()).resolves.toBe(CUENTA);
  });
});

describe('iniciarSesionConMicrosoft', () => {
  it('abre la ventana emergente pidiendo escoger la cuenta y la deja activa', async () => {
    configurarEntorno();
    app.loginPopup.mockResolvedValue({ account: CUENTA });
    const { iniciarSesionConMicrosoft } = await cargarMsalAuth();

    const cuenta = await iniciarSesionConMicrosoft();

    expect(app.loginPopup).toHaveBeenCalledWith({ scopes: ['api://growlink/acceso'], prompt: 'select_account' });
    expect(app.setActiveAccount).toHaveBeenCalledWith(CUENTA);
    expect(cuenta).toBe(CUENTA);
  });

  it('si el navegador bloquea la ventana emergente, se va por redirección', async () => {
    configurarEntorno();
    app.loginPopup.mockRejectedValue(new Errores.DeMsal('popup_window_error', 'bloqueada'));
    const { iniciarSesionConMicrosoft } = await cargarMsalAuth();

    // devuelve null porque la página se va: la cuenta se resuelve al volver
    await expect(iniciarSesionConMicrosoft()).resolves.toBeNull();
    expect(app.loginRedirect).toHaveBeenCalledWith({ scopes: ['api://growlink/acceso'] });
  });

  it('si la persona cancela, lo dice con un mensaje claro y sin redirigir', async () => {
    configurarEntorno();
    app.loginPopup.mockRejectedValue(new Errores.DeMsal('user_cancelled', 'cancelado'));
    const { iniciarSesionConMicrosoft, MicrosoftAuthError } = await cargarMsalAuth();

    const error = await iniciarSesionConMicrosoft().catch((e) => e);

    expect(error).toBeInstanceOf(MicrosoftAuthError);
    expect(error.message).toBe('Cancelaste el inicio de sesión.');
    expect(error.requiereLogin).toBe(true);
    expect(app.loginRedirect).not.toHaveBeenCalled();
  });

  it('cualquier otro error de MSAL llega traducido, no crudo', async () => {
    configurarEntorno();
    app.loginPopup.mockRejectedValue(new Errores.DeMsal('crypto_nonexistent', 'sin WebCrypto'));
    const { iniciarSesionConMicrosoft } = await cargarMsalAuth();

    await expect(iniciarSesionConMicrosoft()).rejects.toThrow('No se pudo iniciar sesión con Microsoft: sin WebCrypto');
  });
});

describe('obtenerAccessToken', () => {
  it('devuelve el token de la cuenta activa sin forzar renovación', async () => {
    configurarEntorno();
    app.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-abc' });
    const { obtenerAccessToken } = await cargarMsalAuth();

    await expect(obtenerAccessToken()).resolves.toBe('token-abc');
    expect(app.acquireTokenSilent).toHaveBeenCalledWith({
      scopes: ['api://growlink/acceso'],
      account: CUENTA,
      forceRefresh: false,
    });
  });

  it('puede pedir un token nuevo a la fuerza (lo usan los reintentos)', async () => {
    configurarEntorno();
    app.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-nuevo' });
    const { obtenerAccessToken } = await cargarMsalAuth();

    await obtenerAccessToken(true);

    expect(app.acquireTokenSilent).toHaveBeenCalledWith(expect.objectContaining({ forceRefresh: true }));
  });

  it('sin cuenta activa pide volver a iniciar sesión, sin llamar a MSAL por un token', async () => {
    configurarEntorno();
    app.getActiveAccount.mockReturnValue(null);
    const { obtenerAccessToken, MicrosoftAuthError } = await cargarMsalAuth();

    const error = await obtenerAccessToken().catch((e) => e);

    expect(error).toBeInstanceOf(MicrosoftAuthError);
    expect(error.requiereLogin).toBe(true);
    expect(app.acquireTokenSilent).not.toHaveBeenCalled();
  });

  it('cuando la renovación en silencio no alcanza, pide volver a iniciar sesión', async () => {
    configurarEntorno();
    app.acquireTokenSilent.mockRejectedValue(new Errores.DeMsal('interaction_required', 'hace falta interacción'));
    const { obtenerAccessToken, MicrosoftAuthError } = await cargarMsalAuth();

    const error = await obtenerAccessToken().catch((e) => e);

    expect(error).toBeInstanceOf(MicrosoftAuthError);
    expect(error.requiereLogin).toBe(true);
    expect(error.message).toMatch(/venció/);
  });
});

describe('cerrarSesionMicrosoft', () => {
  it('limpia la caché de MSAL y deja de haber cuenta activa', async () => {
    configurarEntorno();
    const { cerrarSesionMicrosoft } = await cargarMsalAuth();

    await cerrarSesionMicrosoft();

    expect(app.clearCache).toHaveBeenCalledWith({ account: CUENTA });
    expect(app.setActiveAccount).toHaveBeenCalledWith(null);
  });

  it('en modo legacy no hace nada', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'legacy');
    const { cerrarSesionMicrosoft } = await cargarMsalAuth();

    await cerrarSesionMicrosoft();

    expect(app.clearCache).not.toHaveBeenCalled();
  });

  it('si MSAL no se pudo ni crear, cerrar sesión no falla', async () => {
    configurarEntorno({ VITE_AZURE_CLIENT_ID: '' });
    const { cerrarSesionMicrosoft } = await cargarMsalAuth();

    await expect(cerrarSesionMicrosoft()).resolves.toBeUndefined();
  });
});
