/// <reference types="vite/client" />

// What the build reads. Both are optional to the type system because a value
// can genuinely be absent — lib/config.ts is where that is turned into a
// thrown error, and the single place the rest of the app reads them.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
