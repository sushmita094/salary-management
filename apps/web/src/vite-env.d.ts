/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Dev uses the Vite `/api` proxy; prod sets the deployed origin. */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
