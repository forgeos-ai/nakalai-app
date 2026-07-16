/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYMENT_MODE: 'MOCK' | 'TEST' | 'LIVE';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs';
