/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** "1" liga o mock da Conferência (só em dev; ver src/mocks/settlement.ts). */
  readonly VITE_MOCK_CONFERIR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Versão do package.json, injetada pelo Vite (vite.config.ts). */
declare const __APP_VERSION__: string;
