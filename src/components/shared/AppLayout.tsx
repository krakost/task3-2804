import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'

import { AuthDialogs, type AuthDialogMode } from '@/components/shared/AuthDialogs'
import { Button } from '@/components/ui/button'

const linkClass =
  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
const linkActive = 'bg-accent text-accent-foreground'

export function AppLayout() {
  const [authDialog, setAuthDialog] = useState<AuthDialogMode>('closed')

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
          <div className="ml-auto flex items-center gap-2">
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
          </div>
        </div>
      </header>
      <AuthDialogs mode={authDialog} onModeChange={setAuthDialog} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
