/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_E2E?: string
  /** Google Cloud project number for Picker `setAppId` (optional). */
  readonly VITE_GOOGLE_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
