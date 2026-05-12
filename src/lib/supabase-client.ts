import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Только для PostgREST: зависшие запросы не держат UI. Auth оставляем на нативном fetch — иначе ломается цепочка AbortSignal (вход по паролю / PKCE). */
const REST_FETCH_TIMEOUT_MS = 28_000

function requestUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function isSupabaseAuthRequest(input: RequestInfo | URL): boolean {
  try {
    return requestUrlString(input).includes('/auth/v1/')
  } catch {
    return false
  }
}

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const id = window.setTimeout(() => controller.abort(), timeoutMs)

  const upstream = init?.signal
  if (upstream) {
    if (upstream.aborted) {
      window.clearTimeout(id)
      controller.abort()
    } else {
      upstream.addEventListener(
        'abort',
        () => {
          window.clearTimeout(id)
          controller.abort()
        },
        { once: true },
      )
    }
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    window.clearTimeout(id)
  })
}

function readEnv(): { url: string; key: string } | null {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!rawUrl || !key) return null

  let url = rawUrl.replace(/\/+$/, '')
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    url = `${parsed.protocol}//${parsed.host}`
  } catch {
    return null
  }

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
      global: {
        fetch: (input, init) =>
          isSupabaseAuthRequest(input)
            ? fetch(input, init)
            : fetchWithTimeout(input, init, REST_FETCH_TIMEOUT_MS),
      },
    })
  : null

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase)
}
