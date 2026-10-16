import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { notify } from '@/components/ui/Toaster'
import { usersApi, useUserMutation } from '../api'
import type { CredentialResult, UserRow } from '../types'
import { CredentialResults } from './CredentialResults'
import { Modal } from '@/components/ui/admin'
import { FormDialog, who } from './FormDialog'

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

export function ResetPasswordDialog({ users, onClose, onDone }: Props) {
  const [requireChange, setRequireChange] = useState(true)
  const [results, setResults] = useState<CredentialResult[] | null>(null)
  const run = useUserMutation(
    () => usersApi.resetPassword(users.map((u) => u.id), requireChange),
    (r) => {
      setResults(r.results)
      summarize('Password reset', r.results)
      onDone()
    },
  )
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Reset password for ${who(users.map((u) => u.displayName))}`}
      description={results ? undefined : 'A new random password is generated for each user.'}
      submitLabel="Reset password"
      onSubmit={() => run.mutate(undefined)}
      busy={run.isPending}
      size="md"
      footer={results ? done(onClose) : undefined}
    >
      {results ? (
        <CredentialResults results={results} kind="password" />
      ) : (
        <Checkbox checked={requireChange} onChange={setRequireChange} label="Require a password change at next sign-in" />
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
