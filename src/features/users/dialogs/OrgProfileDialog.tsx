import { useQueryClient } from '@tanstack/react-query'
import { Building2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { ErrorState } from '@/components/ui/StateViews'
import { notify } from '@/components/ui/Toaster'
import { useOrgProfile, usersApi, useUserMutation } from '../api'
import type { OrgProfile } from '../types'
import { FormDialog } from '@/components/ui/FormDialog'
import { languages } from './SettingDialogs'
import { Loading } from '@/components/ui/Loader'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function OrgForm({ org, onClose }: { org: OrgProfile; onClose: () => void }) {
  const qc = useQueryClient()
  const [contact, setContact] = useState(org.technicalContacts[0] ?? '')
  const [language, setLanguage] = useState(org.preferredLanguage ?? 'en-US')
  const [applyAll, setApplyAll] = useState(false)
  const [includeMailbox, setIncludeMailbox] = useState(true)
  const [error, setError] = useState<string>()

  // the org's own language may be outside the common list; keep it selectable
  const options = [
    ...(languages.some(([c]) => c === language) ? [] : [{ value: language, label: language }]),
    ...languages.map(([code, name]) => ({ value: code, label: name, hint: code })),
  ]

  const save = useUserMutation(
    () => usersApi.updateOrg({ technicalContact: contact.trim(), preferredLanguage: language, applyToAllUsers: applyAll, includeMailbox: applyAll && includeMailbox }),
    (r) => {
      qc.setQueryData(['organization'], r.organization)
      notify.success('Organization profile saved', {
        description: applyAll && r.usersUpdated !== undefined ? `Language applied to ${r.usersUpdated} user${r.usersUpdated === 1 ? '' : 's'}.` : undefined,
      })
      onClose()
    },
  )

  function submit() {
    if (contact.trim() && !EMAIL.test(contact.trim())) return setError('Enter a valid email address.')
    setError(undefined)
    save.mutate(undefined)
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Organization profile"
      submitLabel={applyAll ? 'Save and apply to all users' : 'Save'}
      onSubmit={submit}
      busy={save.isPending}
      size="md"
    >
      <dl className="grid gap-3 rounded-[var(--radius-paper)] border border-line bg-paper-2 p-4">
        <div className="min-w-0">
          <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Organization</dt>
          <dd className="mt-1 flex items-start gap-2 font-semibold">
            <Building2 className="mt-1 size-4 shrink-0 text-ink-3" aria-hidden />
            <span className="min-w-0 break-words">{org.displayName}</span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Tenant ID</dt>
          <dd className="tabular mt-1 text-sm break-all text-ink-2 select-all">
            {org.tenantId}
          </dd>
        </div>
      </dl>

      <Field
        label="Technical contact (email)"
        type="email"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="admin@example.com"
        hint="Microsoft sends service and security notices here."
        error={error}
        autoComplete="off"
      />

      <Select label="Language (preferredLanguage)" showLabel variant="field" value={language} onChange={setLanguage} options={options} />

      <div className="flex flex-col gap-2.5 border-t border-line pt-4">
        <Checkbox
          checked={applyAll}
          onChange={setApplyAll}
          label={
            <span>
              Apply this language to <b>ALL users</b> in the tenant
            </span>
          }
        />
        <div className={`pl-7 ${applyAll ? '' : 'opacity-50'}`}>
          <Checkbox checked={includeMailbox} onChange={setIncludeMailbox} label="Also change the mailbox language (Outlook)" />
        </div>
        <p className="text-sm text-ink-3">Unticked: only the organization setting changes. Ticked: every user’s preferredLanguage changes too, and it is not reverted automatically.</p>
        {applyAll && (
          <p className="flex items-start gap-2 rounded-[var(--radius-paper)] border border-warn/50 bg-warn-wash px-3 py-2 text-sm text-ink">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            This overwrites the language every user chose for themselves.
          </p>
        )}
      </div>
    </FormDialog>
  )
}

export function OrgProfileDialog({ onClose }: { onClose: () => void }) {
  const org = useOrgProfile(true)
  if (org.data) return <OrgForm org={org.data} onClose={onClose} />
  return (
    <FormDialog open onClose={onClose} title="Organization profile" submitLabel="Save" onSubmit={() => {}} disabled size="md">
      {org.isError ? <ErrorState error={org.error} onRetry={() => org.refetch()} /> : <Loading label="Loading organization…" />}
    </FormDialog>
  )
}
