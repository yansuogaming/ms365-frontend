import { ArrowRight, KeyRound, LockKeyhole } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { navigation } from '@/app/navigation'
import { ApiStatus } from '@/app/shell/ApiStatus'
import { Logo } from '@/components/brand/Logo'
import { Button, IconButton } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Morph, morphIcons } from '@/components/ui/Morph'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { notify } from '@/components/ui/Toaster'
import { ApiError } from '@/lib/api/client'
import { parseCredential } from './api'
import { useLogin, useSession } from './useSession'

function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return 'Email or password is incorrect for this tenant.'
    if (error.status === 429) return 'Too many attempts. Wait a minute, then try again.'
    return error.message
  }
  return 'Sign-in failed. Try again.'
}

// Three workspaces fanned out like cards on a desk, each showing its real tools.
const fan = ['identity', 'security', 'admin']
  .map((id) => navigation.find((g) => g.id === id))
  .filter((g) => g !== undefined)
const fanPose = [
  { rotate: -9, x: -78, y: 26 },
  { rotate: 6, x: 70, y: -10 },
  { rotate: -2, x: 0, y: 6 },
]

function WorkspaceFan() {
  const reduce = useReducedMotion()
  return (
    <div className="relative mx-auto h-80 w-full max-w-sm" aria-hidden>
      {fan.map((group, i) => (
        <motion.div
          key={group.id}
          initial={reduce ? false : { opacity: 0, y: 40, rotate: 0 }}
          animate={{ opacity: 1, ...fanPose[i] }}
          transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="paper-shadow absolute inset-x-0 top-6 mx-auto w-64 rounded-[var(--radius-paper)] bg-paper p-4 text-ink"
        >
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg font-semibold">{group.label}</p>
            <p className="text-xs text-ink-3">{group.items.length} tools</p>
          </div>
          <ul className="mt-3 space-y-1.5">
            {group.items.slice(0, 4).map(({ label, path, icon: Icon }) => (
              <li key={path} className="flex items-center gap-2.5 rounded-md bg-paper-2 px-2.5 py-1.5 text-sm text-ink-2">
                <Icon className="size-4 text-coral-ink" strokeWidth={1.75} />
                {label}
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  )
}

export function LoginPage() {
  const { data: session } = useSession()
  const login = useLogin()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/dashboard'

  const [credential, setCredential] = useState('')
  const [show, setShow] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)

  if (session) return <Navigate to={from} replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = parseCredential(credential)
    if (!parsed) {
      setFormatError('Enter the credential as email:password, for example admin@tenant.onmicrosoft.com:yourPassword.')
      return
    }
    setFormatError(null)
    login.mutate(parsed, {
      onSuccess: () => {
        setCredential('')
        navigate(from, { replace: true })
      },
      onError: (err) => notify.error(loginErrorMessage(err)),
    })
  }

  const error = formatError ?? (login.isError ? loginErrorMessage(login.error) : undefined)

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* the console's cover, closed */}
      <aside className="vinyl relative hidden overflow-hidden p-10 text-on-cover lg:flex lg:flex-col lg:justify-between">
        <span className="absolute inset-y-0 left-0 w-5 bg-[oklch(0_0_0/0.2)]" aria-hidden />
        <div className="pl-6">
          <Logo to="/login" />
        </div>
        <WorkspaceFan />
        <div className="max-w-sm pl-6">
          <p className="font-display text-2xl leading-snug font-semibold">Every Microsoft 365 tenant, one calm console.</p>
          <p className="mt-3 text-sm text-on-cover/70">
            {navigation.reduce((n, g) => n + g.items.length, 0)} tools across {navigation.length} workspaces.
          </p>
        </div>
      </aside>

      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-8">
          <div className="lg:invisible">
            <Logo to="/login" tagline={false} />
          </div>
          <div className="flex items-center gap-2">
            <ApiStatus className="hidden sm:inline-flex" />
            <ThemeToggle />
          </div>
        </div>

        <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:px-8 lg:items-center lg:pt-0">
          <div className="w-full max-w-md">
            <p className="flex items-center gap-2 text-sm font-semibold text-coral-ink">
              <KeyRound className="size-4" aria-hidden />
              Tenant sign-in
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Sign in to a tenant</h1>
            <p className="mt-2 text-ink-2">Paste the tenant admin credential to open its console.</p>

            <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
              <Field
                label="Credential"
                type={show ? 'text' : 'password'}
                value={credential}
                onChange={(e) => {
                  setCredential(e.target.value)
                  if (formatError) setFormatError(null)
                }}
                placeholder="admin@tenant.onmicrosoft.com:password"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                data-1p-ignore
                data-lpignore="true"
                hint="Format: email, a colon, then the password."
                error={error}
                trailing={
                  <IconButton label={show ? 'Hide credential' : 'Show credential'} onClick={() => setShow((v) => !v)}>
                    <Morph icon={show ? morphIcons.EyeOff : morphIcons.Eye} size={20} />
                  </IconButton>
                }
              />
              <Button type="submit" size="lg" loading={login.isPending} disabled={credential.length === 0} className="mt-1 w-full">
                {login.isPending ? 'Signing in…' : 'Sign in'}
                {!login.isPending && <ArrowRight className="size-4" aria-hidden />}
              </Button>
            </form>

            <p className="mt-8 flex items-start gap-2.5 border-t border-line pt-5 text-sm text-ink-2">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-coral-ink" aria-hidden />
              The credential goes straight to the API and is never saved in this browser.
            </p>
          </div>
        </main>

        <p className="pb-6 text-center text-xs text-ink-3">© {COPYRIGHT_YEAR} M365 Admin · v{__APP_VERSION__}</p>
      </div>
    </div>
  )
}

const COPYRIGHT_YEAR = new Date().getFullYear()
