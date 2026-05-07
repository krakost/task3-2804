import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/store'
import { supabase } from '@/lib/supabase-client'

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
      const { data } = await supabase.auth.getSession()
      if (!cancelled) setSession(data.session ?? null)
      setHydrated(true)
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
