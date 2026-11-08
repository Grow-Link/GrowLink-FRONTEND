// Inicio de sesión con Microsoft (Entra ID) con @azure/msal-browser: Authorization Code + PKCE, que es el
// flujo que MSAL usa para aplicaciones de navegador. Todo sale de variables de entorno — aquí no hay ningún
// secreto, y en este flujo no existe client secret (por eso hace falta PKCE).
//
//   VITE_AZURE_CLIENT_ID   id de la aplicación registrada en Entra ID
//   VITE_AZURE_AUTHORITY   https://login.microsoftonline.com/<tenant-id>  (o /common, /organizations)
//   VITE_API_SCOPE         scope del API que firma el access token, p. ej. api://<id-del-api>/acceso
//                          (varios separados por espacios o comas)
//
// Solo se usa en modo `oidc` (ver authMode.ts). En modo `legacy` nada de este archivo se ejecuta: el
// PublicClientApplication se crea de forma diferida, la primera vez que alguien pide un token o una cuenta.
//
// No se usa @azure/msal-react a propósito: el token no lo pide un componente sino la capa de servicios
// (backendSession.authorizedFetch y triviaSocket), que no son hooks. Con una instancia de módulo esa capa
// queda igual de simple y no hace falta que todo el árbol dependa de un provider.
//
// La librería se carga con un import dinámico, no estático: son unos 280 kB (70 kB comprimidos) que en modo
// `legacy` —el de por defecto— nadie usaría. Así solo los descarga quien de verdad entra con Microsoft. Por
// eso también los errores de MSAL se reconocen por su `errorCode` y no con `instanceof`: comprobar la clase
// obligaría a importarla de forma estática y volvería a meter la librería en el paquete.

import type { AccountInfo, Configuration, PublicClientApplication } from '@azure/msal-browser';
import { esOidc } from './authMode';

/** Algo falló en el inicio de sesión con Microsoft (o falta configurarlo). */
export class MicrosoftAuthError extends Error {
  /**
   * true cuando lo único que falta es que la persona vuelva a iniciar sesión (su sesión de Microsoft venció,
   * la canceló, o nunca la abrió). false cuando es un problema de configuración, que no se arregla
   * reintentando y por eso se le muestra tal cual.
   */
  readonly requiereLogin: boolean;

  constructor(message: string, requiereLogin = false) {
    super(message);
    this.name = 'MicrosoftAuthError';
    this.requiereLogin = requiereLogin;
  }
}

/**
 * Cuántos segundos antes del vencimiento MSAL da por vencido un access token y lo renueva con el refresh
 * token. Con esto la renovación en silencio pasa ANTES de que venza, sin temporizadores propios: cada
 * llamada autenticada pide el token por acquireTokenSilent (ver obtenerAccessToken).
 */
const MARGEN_RENOVACION_SEGUNDOS = 300;

/** Códigos de MSAL que significan que el navegador no dejó abrir la ventana emergente. */
const POPUP_BLOQUEADO = new Set(['popup_window_error', 'empty_window_error', 'block_iframe_reload']);

/**
 * Códigos con los que MSAL dice que la renovación en silencio ya no alcanza y hace falta que la persona
 * vuelva a autenticarse (son los de InteractionRequiredAuthErrorCodes de @azure/msal-common).
 */
const INTERACCION_REQUERIDA = new Set([
  'interaction_required',
  'login_required',
  'consent_required',
  'no_tokens_found',
  'refresh_token_expired',
  'bad_token',
  'interrupted_user',
  'native_account_unavailable',
  'ui_not_allowed',
]);

/** El `errorCode` de un error de MSAL, o null si el error no viene de MSAL. */
function codigoDe(err: unknown): string | null {
  const codigo = (err as { errorCode?: unknown } | null)?.errorCode;
  return typeof codigo === 'string' && codigo ? codigo : null;
}

function variable(valor: string | undefined): string {
  return (valor ?? '').trim();
}

function configuracion(nivelDeLog: number): Configuration {
  const clientId = variable(import.meta.env.VITE_AZURE_CLIENT_ID);
  const authority = variable(import.meta.env.VITE_AZURE_AUTHORITY);
  if (!clientId || !authority) {
    throw new MicrosoftAuthError(
      'Falta configurar el inicio de sesión con Microsoft: define VITE_AZURE_CLIENT_ID y VITE_AZURE_AUTHORITY.'
    );
  }
  return {
    auth: {
      clientId,
      authority,
      // La app es una SPA con una sola entrada: el redirect URI registrado en Entra ID es el origen.
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      // sessionStorage, igual que la sesión de la app (ver backendSession): las dos mueren con la pestaña,
      // así no queda una sesión de Microsoft viva cuando la de la app ya no está.
      cacheLocation: 'sessionStorage',
    },
    system: {
      tokenRenewalOffsetSeconds: MARGEN_RENOVACION_SEGUNDOS,
      loggerOptions: { logLevel: nivelDeLog, piiLoggingEnabled: false, loggerCallback: () => {} },
    },
  };
}

/** Los scopes que se piden para el access token de los microservicios. */
function scopes(): string[] {
  const scope = variable(import.meta.env.VITE_API_SCOPE);
  if (!scope) {
    throw new MicrosoftAuthError('Falta configurar VITE_API_SCOPE: es el scope del API que firma el access token.');
  }
  return scope.split(/[\s,]+/).filter(Boolean);
}

let instancia: Promise<PublicClientApplication> | null = null;

/**
 * La instancia de MSAL, creada una sola vez (y con ella se descarga la librería). Al crearla se atiende la
 * vuelta del login por redirección (el respaldo cuando la ventana emergente está bloqueada) y se deja
 * activa la cuenta que haya.
 */
export function msal(): Promise<PublicClientApplication> {
  if (!instancia) {
    instancia = (async () => {
      // antes de descargar la librería se revisa la configuración: si falta, el mensaje es más claro
      const clientId = variable(import.meta.env.VITE_AZURE_CLIENT_ID);
      const authority = variable(import.meta.env.VITE_AZURE_AUTHORITY);
      if (!clientId || !authority) {
        throw new MicrosoftAuthError(
          'Falta configurar el inicio de sesión con Microsoft: define VITE_AZURE_CLIENT_ID y VITE_AZURE_AUTHORITY.'
        );
      }

      const { LogLevel, PublicClientApplication } = await import('@azure/msal-browser');
      const app = new PublicClientApplication(configuracion(LogLevel.Error));
      await app.initialize();
      const resultado = await app.handleRedirectPromise();
      if (resultado?.account) app.setActiveAccount(resultado.account);
      if (!app.getActiveAccount()) {
        const [primera] = app.getAllAccounts();
        if (primera) app.setActiveAccount(primera);
      }
      return app;
    })();
    // si falló (p. ej. falta configuración) el fallo no se queda cacheado: el siguiente intento reintenta
    instancia.catch(() => {
      instancia = null;
    });
  }
  return instancia;
}

/**
 * Convierte lo que lanza MSAL en un error con un mensaje que se le puede mostrar a la persona. Todos los
 * caminos terminan en requiereLogin = true: cualquiera de estos fallos se resuelve volviendo a iniciar
 * sesión, así que si un código no estuviera en la lista solo cambiaría la redacción, no lo que hace la app.
 */
function traducir(err: unknown): MicrosoftAuthError {
  if (err instanceof MicrosoftAuthError) return err;

  const codigo = codigoDe(err);
  if (codigo && INTERACCION_REQUERIDA.has(codigo)) {
    return new MicrosoftAuthError('Tu sesión de Microsoft venció. Vuelve a iniciar sesión.', true);
  }
  if (codigo === 'user_cancelled') return new MicrosoftAuthError('Cancelaste el inicio de sesión.', true);
  if (codigo) {
    const detalle = (err as { errorMessage?: string }).errorMessage || (err as Error).message;
    return new MicrosoftAuthError(`No se pudo iniciar sesión con Microsoft: ${detalle}`, true);
  }
  return new MicrosoftAuthError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con Microsoft.', true);
}

/** La cuenta de Microsoft con sesión abierta en esta pestaña, o null si no hay (o si el modo no es `oidc`). */
export async function cuentaActiva(): Promise<AccountInfo | null> {
  if (!esOidc()) return null;
  const app = await msal();
  return app.getActiveAccount();
}

/**
 * Abre el inicio de sesión. Se usa una ventana emergente para no perder el estado de la app; si el navegador
 * la bloquea se cae a la redirección y devuelve null, porque la página se va y la cuenta queda resuelta al
 * volver (ver msal()).
 */
export async function iniciarSesionConMicrosoft(): Promise<AccountInfo | null> {
  const app = await msal();
  try {
    const resultado = await app.loginPopup({ scopes: scopes(), prompt: 'select_account' });
    app.setActiveAccount(resultado.account);
    return resultado.account;
  } catch (err) {
    const codigo = codigoDe(err);
    if (codigo && POPUP_BLOQUEADO.has(codigo)) {
      await app.loginRedirect({ scopes: scopes() });
      return null;
    }
    throw traducir(err);
  }
}

/**
 * El access token para llamar a los microservicios. MSAL lo devuelve de su caché mientras siga vigente y lo
 * renueva en silencio con el refresh token cuando le faltan menos de MARGEN_RENOVACION_SEGUNDOS para vencer;
 * como cada llamada autenticada pasa por aquí, la renovación ocurre antes del vencimiento sin más.
 *
 * `renovar` fuerza un token nuevo aunque el de la caché parezca válido — lo usan los reintentos cuando un
 * servicio rechazó el token (ver backendSession y triviaSocket).
 *
 * Si la renovación en silencio no alcanza (hace falta que la persona vuelva a autenticarse) lanza un
 * MicrosoftAuthError con requiereLogin = true, que es lo que lleva de vuelta a la pantalla de ingreso.
 */
export async function obtenerAccessToken(renovar = false): Promise<string> {
  const app = await msal();
  const account = app.getActiveAccount();
  if (!account) throw new MicrosoftAuthError('No hay una sesión de Microsoft abierta.', true);
  try {
    const resultado = await app.acquireTokenSilent({ scopes: scopes(), account, forceRefresh: renovar });
    return resultado.accessToken;
  } catch (err) {
    throw traducir(err);
  }
}

/**
 * Cierra la sesión de Microsoft: clearCache borra de MSAL todos los tokens de la cuenta y la cuenta misma,
 * sin mandar a la persona a la página de Microsoft (eso sería logoutRedirect), así se queda en la app, en la
 * pantalla de ingreso. Como el siguiente inicio de sesión pide `prompt: 'select_account'`, tampoco vuelve a
 * entrar sola. En modo `legacy` no hace nada.
 */
export async function cerrarSesionMicrosoft(): Promise<void> {
  if (!esOidc()) return;
  const app = await msal().catch(() => null);
  if (!app) return;
  await app.clearCache({ account: app.getActiveAccount() });
  app.setActiveAccount(null);
}
