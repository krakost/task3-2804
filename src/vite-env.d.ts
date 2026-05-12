/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** POST JSON body `{ "task": "..." }` — см. docs/VENICE-BREAKDOWN.md */
  readonly VITE_VENICE_BREAKDOWN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
