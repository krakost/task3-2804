import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** Supabase client; enable env vars before using against a real backend. */
export const supabase = createClient(url, anonKey)
