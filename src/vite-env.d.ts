/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLATFORM_ADMINS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
