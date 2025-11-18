/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NHCX_API_BASE_URL?: string;
  readonly VITE_NHCX_POLLING_INTERVAL?: string;
  readonly VITE_NHCX_MAX_POLLING_ATTEMPTS?: string;
  readonly VITE_FHIR_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

