import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Select } from '@/components/ui/Select'
import { generatePassword, passwordProblem, passwordStyles, type PasswordStyle } from '@/lib/random'
import { notify } from '@/components/ui/Toaster'
import { usersApi, useUserMutation } from '../api'
import type { CredentialResult, UserRow } from '../types'
import { CredentialResults } from './CredentialResults'
import { Modal } from '@/components/ui/admin'
import { FormDialog } from '@/components/ui/FormDialog'

interface Props {
  users: UserRow[]
  onClose: () => void
  onDone: () => void
}

function summarize(kind: string, results: CredentialResult[]) {
  const ok = results.filter((r) => r.secret).length
  const failed = results.length - ok
  if (failed === 0) notify.success(`${kind} for ${ok} user${ok === 1 ? '' : 's'}`)
  else if (ok > 0) notify.warning(`${kind} for ${ok}, ${failed} failed`)
  else notify.error(`${kind} failed for every selected user`)
}

const done = (onClose: () => void) => (
  <Button type="button" onClick={onClose}>
    Done
  </Button>
)

type ResetMode = 'random' | 'shared'

export function ResetPasswordDialog({ users, onClose, onDone }: Props) {
  const n = users.length
  const [mode, setMode] = useState<ResetMode>('random')
  const [style, setStyle] = useState<PasswordStyle>('random12')
  const [password, setPassword] = useState(() => generatePassword('random12'))
  const [requireChange, setRequireChange] = useState(false)
  const [touched, setTouched] = useState(false)
  const [results, setResults] = useState<CredentialResult[] | null>(null)
  const problem = mode === 'shared' ? passwordProblem(password) : null
  const run = useUserMutation(
    () => usersApi.resetPassword(users.map((u) => u.id), requireChange, mode === 'shared' ? password : undefined),
    (r) => {
      setResults(r.results)
      summarize('Password reset', r.results)
      onDone()
    },
  )
  const count = `${n} user${n === 1 ? '' : 's'}`
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Reset password — ${count}`}
      description={n === 1 ? users[0].upn : undefined}
      submitLabel={`Reset ${count}`}
      onSubmit={() => {
        setTouched(true)
        if (!problem) run.mutate(undefined)
      }}
      busy={run.isPending}
      size="md"
      footer={results ? done(onClose) : undefined}
    >
      {results ? (
        <CredentialResults results={results} kind="password" />
      ) : (
        <div className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="New password" className="flex flex-col gap-2.5">
            {(
              [
                ['random', n === 1 ? 'Random strong password' : 'Random password for each user', '(strongest)'],
                ['shared', n === 1 ? 'Set the password myself' : 'One shared password for everyone', ''],
              ] as const
            ).map(([value, label, note]) => (
              <label key={value} className="flex cursor-pointer items-center gap-3 text-[0.95rem]">
                <input type="radio" name="reset-mode" checked={mode === value} onChange={() => setMode(value)} className="size-4 shrink-0 accent-[var(--coral)]" />
                <span>
                  {label} {note && <span className="text-ink-3">{note}</span>}
                </span>
              </label>
            ))}
          </div>

          {mode === 'shared' && (
            <div className="flex flex-col gap-2 pl-7">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
                <input
                  aria-label="Password"
                  aria-invalid={touched && Boolean(problem)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  spellCheck={false}
                  className={`tabular h-11 w-full rounded-[var(--radius-paper)] border bg-paper px-3.5 text-ink outline-none transition-[border-color,box-shadow] focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] ${
                    touched && problem ? 'border-danger' : 'border-line hover:border-ink-3'
                  }`}
                />
                <Select
                  label="Password style"
                  variant="field"
                  value={style}
                  onChange={(v) => {
                    setStyle(v)
                    setPassword(generatePassword(v))
                  }}
                  options={passwordStyles}
                />
                <Button type="button" variant="secondary" className="h-11" onClick={() => setPassword(generatePassword(style))}>
                  <RefreshCw className="size-4" aria-hidden />
                  Random
                </Button>
              </div>
              {touched && problem ? <p className="text-sm text-danger">{problem}</p> : <p className="text-sm text-ink-3">At least 8 characters with 3 of: capital, lower case, number, symbol.</p>}
            </div>
          )}

          <Checkbox checked={requireChange} onChange={setRequireChange} label="Require a password change at next sign-in" />
        </div>
      )}
    </FormDialog>
  )
}

/** Result of the quick TAP from the bulk bar (default lifetime, one-time use). */
export function TapResultDialog({ results, minutes, onClose }: { results: CredentialResult[]; minutes: number; onClose: () => void }) {
  const ok = results.filter((r) => r.secret).length
  return (
    <Modal open onClose={onClose} title={`${results.length > 1 ? 'Bulk TAP' : 'TAP'} generated — ${ok}/${results.length} succeeded`} size="lg">
      <div className="flex flex-col gap-5">
        <CredentialResults results={results} kind="pass" note={`CSV contains UPN + TAP, valid for ${minutes} minutes.`} />
        <div className="sticky -bottom-5 z-10 -mx-6 -mb-5 flex justify-end border-t border-line bg-paper px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
