import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isSupabaseConfigured, supabase } from '@/lib/supabase-client'

export type AuthDialogMode = 'closed' | 'signin' | 'signup'

type AuthDialogsProps = {
  mode: AuthDialogMode
  onModeChange: (mode: AuthDialogMode) => void
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function OrDivider() {
  const { t } = useTranslation()
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-popover px-2 text-muted-foreground">
          {t('authDialog.or')}
        </span>
      </div>
    </div>
  )
}

function ContinueWithGoogleButton({
  disabled,
  loading,
  onContinue,
}: {
  disabled?: boolean
  loading?: boolean
  onContinue: () => void | Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      aria-label={t('authDialog.continueGoogleAria')}
      aria-busy={loading}
      disabled={disabled}
      onClick={() => void onContinue()}
    >
      <GoogleIcon className="size-4 shrink-0" />
      {loading ? t('authDialog.redirecting') : t('authDialog.continueGoogle')}
    </Button>
  )
}

export function AuthDialogs({ mode, onModeChange }: AuthDialogsProps) {
  const { t } = useTranslation()
  const open = mode !== 'closed'
  const activeMode = mode === 'closed' ? 'signin' : mode

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [oauthPending, setOauthPending] = useState(false)

  const busy = pending || oauthPending

  function resetForm() {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setInfo(null)
    setPending(false)
    setOauthPending(false)
  }

  function handleClose() {
    resetForm()
    onModeChange('closed')
  }

  function switchAuthMode(next: 'signin' | 'signup') {
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setInfo(null)
    onModeChange(next)
  }

  async function handleGoogleSignIn() {
    setError(null)
    setInfo(null)
    if (!isSupabaseConfigured() || !supabase) {
      setError(t('authDialog.configHint'))
      return
    }
    setOauthPending(true)
    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}`
          : undefined
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'select_account' },
          scopes: 'email profile',
        },
      })
      if (oauthErr) setError(oauthErr.message)
    } finally {
      setOauthPending(false)
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!isSupabaseConfigured() || !supabase) {
      setError(t('authDialog.configHint'))
      return
    }
    setPending(true)
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signErr) {
        setError(signErr.message)
        return
      }
      resetForm()
      onModeChange('closed')
    } finally {
      setPending(false)
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (password !== confirmPassword) {
      setError(t('authDialog.passwordMismatch'))
      return
    }
    if (!isSupabaseConfigured() || !supabase) {
      setError(t('authDialog.configHint'))
      return
    }
    setPending(true)
    try {
      const redirectTo =
        typeof window !== 'undefined' ? window.location.origin : undefined
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      })
      if (signErr) {
        setError(signErr.message)
        return
      }
      if (data.session) {
        resetForm()
        onModeChange('closed')
      } else {
        setPassword('')
        setConfirmPassword('')
        setInfo(t('authDialog.checkEmail'))
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
    >
      <DialogContent className="gap-6 sm:max-w-[22rem]" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {activeMode === 'signin'
              ? t('authDialog.signIn')
              : t('authDialog.signUp')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {activeMode === 'signin'
              ? t('authDialog.signInDescription')
              : t('authDialog.signUpDescription')}
          </DialogDescription>
        </DialogHeader>

        {activeMode === 'signin' ? (
          <form className="space-y-4" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <Label htmlFor="auth-email">{t('authDialog.email')}</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">{t('authDialog.password')}</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
                minLength={6}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {pending ? t('authDialog.signingIn') : t('authDialog.signIn')}
            </Button>
            <OrDivider />
            <ContinueWithGoogleButton
              disabled={busy}
              loading={oauthPending}
              onContinue={handleGoogleSignIn}
            />
            <p className="text-center text-sm text-muted-foreground">
              {t('authDialog.noAccount')}{' '}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                disabled={busy}
                onClick={() => switchAuthMode('signup')}
              >
                {t('authDialog.signUp')}
              </button>
            </p>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleSignUp}>
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t('authDialog.email')}</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
                aria-invalid={Boolean(error)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">
                {t('authDialog.password')}
              </Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
                minLength={6}
                aria-invalid={Boolean(error)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm">
                {t('authDialog.confirmPassword')}
              </Label>
              <Input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
                required
                minLength={6}
                aria-invalid={Boolean(error)}
              />
            </div>
            {info ? (
              <p className="text-sm text-muted-foreground" role="status">
                {info}
              </p>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {pending ? t('authDialog.signingUp') : t('authDialog.signUp')}
            </Button>
            <OrDivider />
            <ContinueWithGoogleButton
              disabled={busy}
              loading={oauthPending}
              onContinue={handleGoogleSignIn}
            />
            <p className="text-center text-sm text-muted-foreground">
              {t('authDialog.alreadyHaveAccount')}{' '}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                disabled={busy}
                onClick={() => switchAuthMode('signin')}
              >
                {t('authDialog.signIn')}
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
