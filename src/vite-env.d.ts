/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CURSOS_SERVICE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
