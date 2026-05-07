import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'

import { AuthDialogs, type AuthDialogMode } from '@/components/shared/AuthDialogs'
import { BoardsRightSidebar } from '@/components/shared/BoardsRightSidebar'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/store'
import { supabase } from '@/lib/supabase-client'

const linkClass =
  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
const linkActive = 'bg-accent text-accent-foreground'

export function AppLayout() {
  const [authDialog, setAuthDialog] = useState<AuthDialogMode>('closed')
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)

  async function handleSignOut() {
    await supabase?.auth.signOut()
  }

  return (
    <div className="theme flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Kanban</span>
          <nav className="flex gap-1">
            <NavLink
              to="/boards"
              className={({ isActive }) =>
                isActive ? `${linkClass} ${linkActive}` : linkClass
              }
            >
              Boards
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? `${linkClass} ${linkActive}` : linkClass
              }
            >
              Settings
            </NavLink>
          </nav>
          <div className="ml-auto flex min-h-10 items-center justify-end gap-2">
            {hydrated ? (
              user ? (
                <>
                  <span
                    className="max-w-[12rem] truncate text-sm text-muted-foreground sm:max-w-xs"
                    title={user.email ?? undefined}
                  >
                    {user.email}
                  </span>
                  <Button type="button" variant="outline" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAuthDialog('signin')}
                  >
                    Sign in
                  </Button>
                  <Button type="button" onClick={() => setAuthDialog('signup')}>
                    Sign up
                  </Button>
                </>
              )
            ) : null}
          </div>
        </div>
      </header>
      <AuthDialogs mode={authDialog} onModeChange={setAuthDialog} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8">
        {hydrated && user ? (
          <aside className="hidden w-72 shrink-0 lg:block">
            <BoardsRightSidebar />
          </aside>
        ) : null}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
