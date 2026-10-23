/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** "true": o axios responde com dados de exemplo (src/mocks), sem API. */
  readonly VITE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Versão do package.json, injetada pelo Vite (vite.config.ts). */
declare const __APP_VERSION__: string;
