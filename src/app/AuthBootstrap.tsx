import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/store'
import { supabase } from '@/lib/supabase-client'

const GET_SESSION_TIMEOUT_MS = 15_000

/** Syncs Supabase session into Zustand on load and auth events. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession)
  const setHydrated = useAuthStore((s) => s.setHydrated)

  useEffect(() => {
    if (!supabase) {
      setHydrated(true)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<{ data: { session: null } }>(
          (resolve) => {
            window.setTimeout(
              () => resolve({ data: { session: null } }),
              GET_SESSION_TIMEOUT_MS,
            )
          },
        )
        const first = await Promise.race([
          sessionPromise.then((r) => ({ kind: 'session' as const, r })),
          timeoutPromise.then((r) => ({ kind: 'timeout' as const, r })),
        ])

        if (cancelled) return

        if (first.kind === 'timeout') {
          if (import.meta.env.DEV) {
            console.warn(
              '[auth] getSession: превышено время ожидания. Проверьте VITE_SUPABASE_URL, доступ к интернету, VPN и что проект Supabase не на паузе.',
            )
          }
          setSession(null)
        } else {
          const { data, error } = first.r
          if (error && import.meta.env.DEV) {
            console.warn('[auth] getSession:', error.message)
          }
          setSession(data.session ?? null)
        }
      } catch (e) {
        if (!cancelled && import.meta.env.DEV) {
          console.warn('[auth] getSession не удался', e)
        }
        if (!cancelled) setSession(null)
      } finally {
        setHydrated(true)
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setSession, setHydrated])

  return <>{children}</>
}
