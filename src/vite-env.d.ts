/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCOVER: string;
  readonly VITE_UGRC_API: string;
  readonly VITE_FIREBASE_CONFIG: string;

  // add other env variables if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
