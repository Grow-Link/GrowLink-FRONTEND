/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CURSOS_SERVICE_URL?: string;
  /** `legacy` (por defecto) o `oidc` — ver services/authMode.ts. */
  readonly VITE_AUTH_MODE?: string;
  /** Configuración del inicio de sesión con Microsoft, solo en modo `oidc` (ver services/msalAuth.ts). */
  readonly VITE_AZURE_CLIENT_ID?: string;
  readonly VITE_AZURE_AUTHORITY?: string;
  readonly VITE_API_SCOPE?: string;
  /** Encabezado del CONNECT de STOMP en el que trivia-service espera el token (ver services/triviaSocket.ts). */
  readonly VITE_WS_AUTH_HEADER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
