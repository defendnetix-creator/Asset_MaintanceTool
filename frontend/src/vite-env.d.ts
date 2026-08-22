// frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Process type for browser
declare var process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
  };
};