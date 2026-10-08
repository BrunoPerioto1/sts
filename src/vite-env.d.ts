/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Versão do package.json, injetada pelo Vite (vite.config.ts). */
declare const __APP_VERSION__: string;
