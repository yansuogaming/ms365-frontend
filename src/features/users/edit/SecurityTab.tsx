import { KeyRound, Mail, RefreshCw, ShieldOff } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { ConfirmDialog, Tag } from '@/components/ui/admin'
import { Field } from '@/components/ui/Field'
import { notify } from '@/components/ui/Toaster'
import { generatePassword } from '@/lib/random'
import { usersApi, useUserMutation } from '../api'
import type { UserDetail } from '../types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Card({ icon, title, badge, subtitle, children }: { icon: ReactNode; title: string; badge?: ReactNode; subtitle: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-paper)] border border-line p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-coral-wash text-coral-ink">{icon}</span>
        <div>
          <p className="flex items-center gap-2 font-semibold">
            {title}
            {badge}
          </p>
          <p className="text-sm text-ink-3">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function SecurityTab({ user }: { user: UserDetail }) {
  const [password, setPassword] = useState('')
  const [forceChange, setForceChange] = useState(true)
  const [pwError, setPwError] = useState<string>()
  const [email, setEmail] = useState(user.recoveryEmail ?? '')
  const [emailError, setEmailError] = useState<string>()
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  const reset = useUserMutation(
    () => usersApi.setPassword(user.id, password, forceChange),
    () => {
      notify.success('Password reset', { description: forceChange ? 'They must choose a new one at next sign-in.' : undefined })
      setPassword('')
    },
  )
  const revoke = useUserMutation(
    () => usersApi.revokeAndReMfa(user.id),
    () => notify.success('Signed out everywhere', { description: 'They must sign in again and re-register MFA.' }),
  )
  const saveEmail = useUserMutation(
    (value: string | null) => usersApi.setRecoveryEmail(user.id, value),
    (_r, value) => notify.success(value ? 'Recovery email saved' : 'Recovery email cleared'),
  )

  function resetPassword() {
    const kinds = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length
    if (password.length < 8 || kinds < 3) return setPwError('At least 8 characters, using 3 of: capital, lower case, number, symbol.')
    setPwError(undefined)
    reset.mutate(undefined)
  }

  return (
    <div className="grid gap-4 pt-5 md:grid-cols-2">
      <Card icon={<KeyRound className="size-5" aria-hidden />} title="Password" subtitle="Set a new sign-in password">
        <div className="flex items-start gap-2">
          <Field
            label="New password"
            className="flex-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g. Abc12345"
            error={pwError}
            autoComplete="new-password"
            spellCheck={false}
          />
          <Button type="button" variant="secondary" className="mt-7 h-12" onClick={() => setPassword(generatePassword('simple'))}>
            <RefreshCw className="size-4" aria-hidden />
            Gen
          </Button>
        </div>
        <Checkbox checked={forceChange} onChange={setForceChange} label="Force password change at next sign-in" />
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirmRevoke(true)}>
            <ShieldOff className="size-4" aria-hidden />
            Revoke + Re-MFA
          </Button>
          <Button type="button" loading={reset.isPending} disabled={!password} onClick={resetPassword}>
            Reset password
          </Button>
        </div>
      </Card>

      <Card icon={<Mail className="size-5" aria-hidden />} title="Recovery email" badge={<Tag tone="coral">SSPR</Tag>} subtitle="Self-service password reset">
        <Field label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user.backup@example.com" error={emailError} autoComplete="off" />
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!user.recoveryEmail && !email}
            onClick={() => {
              setEmail('')
              saveEmail.mutate(null)
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            loading={saveEmail.isPending}
            disabled={!email || email === user.recoveryEmail}
            onClick={() => {
              if (!EMAIL.test(email.trim())) return setEmailError('Enter a valid email address.')
              setEmailError(undefined)
              saveEmail.mutate(email.trim())
            }}
          >
            Save
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={() => revoke.mutateAsync(undefined)}
        title={`Sign ${user.displayName} out everywhere?`}
        body="Revokes every session and refresh token, and removes registered MFA methods so they set them up again at next sign-in."
        confirmLabel="Revoke + Re-MFA"
        danger
      />
    </div>
  )
}
