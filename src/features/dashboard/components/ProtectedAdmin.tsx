import { CircleCheck, CircleHelp, CircleX, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/admin'
import { Field } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Panel'
import { useDiagnoseProtection, useSyncStatus } from '../api'
import type { CheckState, ProtectionCheck } from '../types'
import { AdHelper } from './AdHelper'

const checkLabel: Record<ProtectionCheck['id'], string> = {
  directorySync: 'Directory sync enabled',
  passwordSync: 'Password sync enabled',
  passwordWritebackOff: 'Password writeback off',
  userSynced: 'User synced from on-premises AD',
  globalAdminRole: 'Holds the Global Administrator role',
}

const checkIcon: Record<CheckState, { icon: typeof CircleCheck; className: string; label: string }> = {
  pass: { icon: CircleCheck, className: 'text-ok', label: 'Pass' },
  fail: { icon: CircleX, className: 'text-danger', label: 'Fail' },
  unknown: { icon: CircleHelp, className: 'text-ink-3', label: 'Unknown' },
}

/** Takes the email part of "email:password" if pasted, so a password is never sent. */
function toUpn(raw: string) {
  const v = raw.trim()
  const sep = v.indexOf(':')
  return sep > 0 ? v.slice(0, sep).trim() : v
}

export function ProtectedAdmin() {
  const diagnose = useDiagnoseProtection()
  const helper = useSyncStatus().data?.onPremHelper
  const [upn, setUpn] = useState('')
  const [invalid, setInvalid] = useState<string>()

  const result = diagnose.data
  const writeback = result ? result.passwordWriteback : undefined

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = toUpn(upn)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setInvalid('Enter the Global Admin UPN, for example admin@tenant.onmicrosoft.com.')
      return
    }
    setInvalid(undefined)
    setUpn(value)
    diagnose.mutate(value)
  }

  return (
    <Panel
      title="Protected Global Admin"
      actions={
        writeback === undefined ? (
          <Tag>Writeback: not checked</Tag>
        ) : writeback === null ? (
          <Tag tone="warn">Writeback: unknown</Tag>
        ) : writeback ? (
          <Tag tone="danger">Writeback: on</Tag>
        ) : (
          <Tag tone="ok">Writeback: off</Tag>
        )
      }
    >
      <div className="px-6 py-5">
        <p className="text-sm text-ink-2">
          Checks whether an admin synced from on-premises AD is protected, so the cloud cannot change its password, UPN or alias.
          Pasting a full credential keeps only the email; the password is never sent.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <Field
            label="Global Admin UPN"
            className="flex-1"
            value={upn}
            onChange={(e) => setUpn(e.target.value)}
            placeholder="admin@domain.com"
            autoComplete="off"
            spellCheck={false}
            error={invalid}
          />
          <Button type="submit" loading={diagnose.isPending} className="sm:mt-7">
            <ShieldCheck className="size-4" aria-hidden />
            Diagnose
          </Button>
        </form>

        {result && (
          <div className="mt-5 rounded-[var(--radius-paper)] border border-line">
            <p className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-sm">
              <span className="truncate font-semibold">{result.upn}</span>
              {result.protected ? <Tag tone="ok">Protected</Tag> : <Tag tone="danger">Not protected</Tag>}
            </p>
            <ul className="divide-y divide-line">
              {result.checks.map((c) => {
                const s = checkIcon[c.state]
                return (
                  <li key={c.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                    <s.icon className={`mt-0.5 size-4 shrink-0 ${s.className}`} aria-label={s.label} />
                    <span className="min-w-0">
                      <span className="text-ink">{checkLabel[c.id]}</span>
                      {c.detail && <span className="block text-ink-3">{c.detail}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {!result && (
          <p className="mt-4 text-sm text-ink-3">
            Runs five checks: directory sync, password sync, password writeback off, user synced, and the Global Administrator role.
          </p>
        )}
      </div>

      <AdHelper key={result?.upn ?? "none"} upn={result?.upn} helperFlag={helper} diagnosing={diagnose.isPending} onDiagnoseAgain={() => result && diagnose.mutate(result.upn)} />
    </Panel>
  )
}
