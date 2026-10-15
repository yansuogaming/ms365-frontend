import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { navigation } from '@/app/navigation'
import { ApiStatusPill } from '@/app/shell/ApiStatusPill'
import { BrandMark } from '@/app/shell/BrandMark'
import { ThemeToggle } from '@/app/shell/ThemeToggle'
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

/** Text whose letters press into the felt one by one, starting at `offset`. */
function Pressed({ text, offset = 0 }: { text: string; offset?: number }) {
  return (
    <span aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden className="letter-press" style={{ ['--i' as string]: offset + i }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}

const YEAR = new Date().getFullYear()

// Letter-press start index per group, so the board fills top to bottom.
const directory = navigation.map((group, i, all) => ({
  group,
  offset: all.slice(0, i).reduce((n, g) => n + g.label.length + 2, 0),
}))

/** Left half: the lobby directory, listing the console's real sections. */
function DirectoryPanel() {
  return (
    <section className="felt relative hidden min-h-dvh flex-col px-10 py-9 text-letter lg:flex xl:px-16">
      <div className="flex items-center gap-3">
        <BrandMark size={32} />
        <span className="font-board text-[18px] font-bold tracking-[0.1em] uppercase">M365 Admin</span>
      </div>

      <div className="my-auto max-w-[560px] py-12">
        <p className="max-w-[16ch] text-[44px] leading-[1.05] font-semibold tracking-[-0.02em] text-balance xl:text-[52px]">
          Every tenant, one front desk.
        </p>
        <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-letter-muted">
          Sign in once per tenant and run mailboxes, licenses, security and devices from a single console.
        </p>

        <div className="mt-10 rounded-[3px] border-[3px] border-brass bg-felt shadow-[inset_0_2px_10px_rgb(0_0_0/0.6)]">
          <ul className="divide-y divide-felt-seam/70 px-5 py-2">
            {directory.map(({ group, offset }) => (
                <li key={group.id} className="flex h-11 items-center gap-3.5 font-board font-bold tracking-[0.08em] uppercase">
                  <span aria-hidden className="h-[3px] w-4 shrink-0" style={{ background: group.tick }} />
                  <span className="flex-1 truncate text-[18px]">
                    <Pressed text={group.label} offset={offset} />
                  </span>
                  <span className="text-[13px] font-semibold tracking-[0.14em] text-letter-muted tabular-nums">
                    {group.items.length} {group.items.length === 1 ? 'tool' : 'tools'}
                  </span>
                </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="font-board text-[12px] tracking-[0.14em] text-letter-muted uppercase">
        © {YEAR} M365 Admin · v{__APP_VERSION__}
      </p>
    </section>
  )
}

export function LoginPage() {
  const { data: session } = useSession()
  const login = useLogin()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/dashboard'

  const [credential, setCredential] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)

  const inputId = useId()
  const hintId = useId()
  const errorId = useId()

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
    })
  }

  const error = formatError ?? (login.isError ? loginErrorMessage(login.error) : null)

  return (
    <div className="grid min-h-dvh bg-ground lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <DirectoryPanel />

      <section className="flex min-h-dvh flex-col">
        <div className="flex items-center gap-2 p-4 sm:p-6">
          <span className="flex items-center gap-2.5 lg:hidden">
            <BrandMark size={28} />
            <span className="font-board text-[16px] font-bold tracking-[0.1em] uppercase">M365 Admin</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ApiStatusPill className="hidden sm:inline-flex" />
            <ThemeToggle />
          </div>
        </div>

        <main className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-10">
          <div className="w-full max-w-[400px]">
            <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.015em]">Sign in to a tenant</h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-ink-muted">
              Paste the tenant admin credential to open its console.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-9">
              <label htmlFor={inputId} className="font-board text-[12px] font-semibold tracking-[0.18em] text-ink-muted uppercase">
                Credential
              </label>
              <div
                className={`mt-2 flex h-12 items-center rounded-board border bg-surface transition-colors focus-within:border-ink ${
                  error ? 'border-danger' : 'border-line hover:border-ink-faint'
                }`}
              >
                <input
                  id={inputId}
                  type={revealed ? 'text' : 'password'}
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
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : hintId}
                  data-1p-ignore
                  data-lpignore="true"
                  className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-[15px] outline-none placeholder:text-ink-faint focus-visible:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setRevealed((r) => !r)}
                  aria-label={revealed ? 'Hide credential' : 'Show credential'}
                  aria-pressed={revealed}
                  className="mr-1.5 grid size-9 place-items-center rounded-[3px] text-ink-faint transition-colors hover:text-ink"
                >
                  {revealed ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>

              {error ? (
                <p id={errorId} role="alert" className="mt-2.5 text-[13px] leading-snug text-danger">
                  {error}
                </p>
              ) : (
                <p id={hintId} className="mt-2.5 text-[13px] text-ink-muted">
                  Format: email, a colon, then the password.
                </p>
              )}

              <button
                type="submit"
                disabled={login.isPending || credential.length === 0}
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-board bg-ink font-semibold text-ground transition-colors hover:bg-ink/88 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {login.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4" aria-hidden />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 flex items-start gap-2.5 border-t border-line pt-5 text-[13px] leading-relaxed text-ink-muted">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden />
              The credential goes straight to the API and is never saved in this browser.
            </p>
          </div>
        </main>

        <p className="pb-6 text-center font-board text-[12px] tracking-[0.12em] text-ink-faint uppercase lg:hidden">
          M365 Admin · v{__APP_VERSION__}
        </p>
      </section>
    </div>
  )
}
