import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function readEnv(): { url: string; key: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) return null
  return { url, key }
}

const env = readEnv()

export const supabase: SupabaseClient | null = env
  ? createClient(env.url, env.key, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase)
}
