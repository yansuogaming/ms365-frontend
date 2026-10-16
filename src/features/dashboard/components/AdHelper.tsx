import { Check, ChevronRight, CircleCheck, CircleHelp, CircleX, Copy, FileCode2, RefreshCw, Search, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, ErrorNote, errorText, Tag } from '@/components/ui/admin'
import { Field } from '@/components/ui/Field'
import { notify } from '@/components/ui/Toaster'
import { useAdHelperStatus, useAdSetupScript, useCreateSyncedAdmin, useRunDeltaSync } from '../api'
import type { AdAccountOptions, AdHelperStatus, HelperCheckState } from '../types'

const checkNames: { key: keyof AdHelperStatus['checks']; label: string; hint: string }[] = [
  { key: 'adModule', label: 'AD module', hint: 'RSAT ActiveDirectory PowerShell module installed' },
  { key: 'adLoaded', label: 'AD loaded', hint: 'Module imports and can reach a domain controller' },
  { key: 'domain', label: 'Domain', hint: 'Host is joined to an AD domain' },
  { key: 'adSync', label: 'ADSync', hint: 'ADSync service present for delta sync' },
  { key: 'entraConnect', label: 'Entra Connect', hint: 'Microsoft Entra Connect installed and configured' },
]

const stateLook: Record<HelperCheckState, { tone: 'ok' | 'warn' | 'neutral'; icon: typeof CircleCheck; word: string }> = {
  ok: { tone: 'ok', icon: CircleCheck, word: 'ready' },
  missing: { tone: 'warn', icon: CircleX, word: 'missing' },
  unknown: { tone: 'neutral', icon: CircleHelp, word: 'not checked' },
}

function CheckTag({ label, hint, state }: { label: string; hint: string; state: HelperCheckState }) {
  const look = stateLook[state]
  return (
    <span title={`${hint}: ${look.word}`}>
      <Tag tone={look.tone}>
        <look.icon className="mr-1 size-3.5" aria-hidden />
        {label}
        <span className="sr-only">: {look.word}</span>
      </Tag>
    </span>
  )
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--coral)]" />
      {children}
    </label>
  )
}

function fromUpn(upn?: string) {
  const at = upn?.indexOf('@') ?? -1
  if (!upn || at < 1) return { upnSuffix: '', samAccountName: '' }
  // sAMAccountName allows at most 20 characters and no "@".
  return { upnSuffix: upn.slice(at + 1), samAccountName: upn.slice(0, at).slice(0, 20) }
}

interface AdHelperProps {
  /** UPN from the last diagnosis; the form prefills from it. Remount (key) when it changes. */
  upn?: string
  /** Helper flag from /directory/sync-status, shown before the helper status loads. */
  helperFlag?: boolean | null
  onDiagnoseAgain: () => void
  diagnosing: boolean
}

export function AdHelper({ upn, helperFlag, onDiagnoseAgain, diagnosing }: AdHelperProps) {
  const [open, setOpen] = useState(false)
  const status = useAdHelperStatus(open)
  const script = useAdSetupScript()
  const create = useCreateSyncedAdmin()
  const delta = useRunDeltaSync()

  const [form, setForm] = useState<AdAccountOptions>(() => ({
    domainFqdn: '',
    ouDn: '',
    passwordNeverExpires: true,
    cannotChangePassword: true,
    ...fromUpn(upn),
  }))
  const [errors, setErrors] = useState<Partial<Record<keyof AdAccountOptions, string>>>({})
  const [confirmCreate, setConfirmCreate] = useState(false)
  const [copied, setCopied] = useState(false)

  const enabled = status.data?.enabled ?? helperFlag ?? null
  const detectedDomain = status.data?.domainFqdn ?? ''
  const set = <K extends keyof AdAccountOptions>(k: K, v: AdAccountOptions[K]) => setForm((f) => ({ ...f, [k]: v }))

  /** Returns the request body, or null after showing field errors. */
  function validated() {
    const body = { ...form, domainFqdn: form.domainFqdn.trim() || detectedDomain, upn: upn ?? '' }
    const next: typeof errors = {}
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(body.domainFqdn)) next.domainFqdn = 'Enter the AD domain, for example ad.example.com.'
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(body.upnSuffix.trim())) next.upnSuffix = 'Enter a domain suffix, for example example.com.'
    if (!/^(OU|CN)=.+,DC=.+/i.test(body.ouDn.trim())) next.ouDn = 'Enter a distinguished name, for example OU=SyncedAdmins,DC=ad,DC=example,DC=com.'
    if (!/^[^\s"/\\[\]:;|=,+*?<>@]{1,20}$/.test(body.samAccountName.trim())) next.samAccountName = 'Up to 20 characters, no spaces or @.'
    setErrors(next)
    return Object.keys(next).length ? null : body
  }

  async function copyScript() {
    if (!script.data) return
    try {
      await navigator.clipboard.writeText(script.data.script)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      notify.success('Setup script copied')
    } catch {
      notify.error('Couldn’t copy to the clipboard', { description: 'Select the script and copy it by hand.' })
    }
  }

  async function checkHelper() {
    const r = await status.refetch()
    if (r.isError) {
      notify.error('AD helper check failed', { description: errorText(r.error) })
      return
    }
    const missing = checkNames.filter((c) => r.data?.checks[c.key] === 'missing').map((c) => c.label)
    if (!r.data?.enabled) notify.warning('AD helper is disabled on the backend', { description: 'Set MAILCREATE_AD_HELPER_ENABLED=1 to allow changes.' })
    else if (missing.length) notify.warning('AD helper is enabled, with gaps', { description: `Missing: ${missing.join(', ')}.` })
    else notify.success('AD helper is ready')
  }

  const statusTag =
    enabled === null ? <Tag>Unknown</Tag> : enabled ? <Tag tone="ok">Helper enabled</Tag> : <Tag tone="warn">Helper disabled</Tag>

  return (
    <details className="group border-t border-line" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-4 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-90" aria-hidden />
        <span className="min-w-0">
          <span className="block font-semibold">On-prem AD setup / Auto helper</span>
          <span className="block text-xs text-ink-3">Advanced, click to open</span>
        </span>
        <span className="ml-auto shrink-0">{statusTag}</span>
      </summary>

      <div className="flex flex-col gap-5 px-6 pb-6">
        <p className="text-sm text-ink-2">
          Runs on the backend host to check the local AD, create a user that matches the cloud UPN, set the “User cannot change
          password” ACL and trigger an ADSync delta. Works only on Windows Server with the RSAT ActiveDirectory module, and fails
          closed unless the backend sets <code className="rounded bg-paper-2 px-1 py-0.5 text-[0.8rem]">MAILCREATE_AD_HELPER_ENABLED=1</code>.
        </p>

        {/* host readiness */}
        <div className="flex flex-wrap gap-2" aria-busy={status.isFetching}>
          {statusTag}
          {checkNames.map((c) => (
            <CheckTag key={c.key} label={c.label} hint={c.hint} state={status.data?.checks[c.key] ?? 'unknown'} />
          ))}
        </div>
        {status.isError && <ErrorNote>{errorText(status.error)}</ErrorNote>}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" loading={status.isFetching} onClick={checkHelper}>
            {!status.isFetching && <Search className="size-4" aria-hidden />}
            Check AD helper
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={script.isPending}
            onClick={() => {
              const body = validated()
              if (body) script.mutate(body)
            }}
          >
            {!script.isPending && <FileCode2 className="size-4" aria-hidden />}
            Generate AD setup script
          </Button>
          <Button variant="ghost" size="sm" disabled={!script.data} onClick={copyScript}>
            {copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? 'Copied' : 'Copy setup script'}
          </Button>
        </div>
        {script.data && (
          <pre className="max-h-64 overflow-auto rounded-[var(--radius-paper)] border border-line bg-paper-2 p-4 text-xs leading-relaxed text-ink">
            <code>{script.data.script}</code>
          </pre>
        )}

        {/* account to create or match in on-premises AD */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="AD domain FQDN"
            value={form.domainFqdn}
            onChange={(e) => set('domainFqdn', e.target.value)}
            placeholder={detectedDomain || 'ad.example.com'}
            hint={detectedDomain && !form.domainFqdn ? `Detected: ${detectedDomain}` : undefined}
            error={errors.domainFqdn}
            spellCheck={false}
            autoComplete="off"
          />
          <Field
            label="UPN suffix"
            value={form.upnSuffix}
            onChange={(e) => set('upnSuffix', e.target.value)}
            placeholder="example.com"
            error={errors.upnSuffix}
            spellCheck={false}
            autoComplete="off"
          />
          <Field
            label="OU DN"
            className="sm:col-span-2"
            value={form.ouDn}
            onChange={(e) => set('ouDn', e.target.value)}
            placeholder="OU=SyncedAdmins,DC=ad,DC=example,DC=com"
            error={errors.ouDn}
            spellCheck={false}
            autoComplete="off"
          />
          <Field
            label="Alias (sAMAccountName)"
            value={form.samAccountName}
            onChange={(e) => set('samAccountName', e.target.value)}
            placeholder="admin"
            maxLength={20}
            error={errors.samAccountName}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Checkbox checked={form.passwordNeverExpires} onChange={(v) => set('passwordNeverExpires', v)}>
            Password never expires
          </Checkbox>
          <Checkbox checked={form.cannotChangePassword} onChange={(v) => set('cannotChangePassword', v)}>
            User cannot change password (ACL)
          </Checkbox>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-5">
          <Button
            size="sm"
            disabled={!upn || enabled !== true}
            title={!upn ? 'Diagnose a Global Admin UPN first' : enabled !== true ? 'The AD helper is not enabled on the backend' : undefined}
            onClick={() => validated() && setConfirmCreate(true)}
          >
            <UserPlus className="size-4" aria-hidden />
            Create / match synced admin
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={delta.isPending}
            disabled={enabled !== true}
            title={enabled !== true ? 'The AD helper is not enabled on the backend' : undefined}
            onClick={() => delta.mutate()}
          >
            {!delta.isPending && <RefreshCw className="size-4" aria-hidden />}
            Run AD delta sync
          </Button>
          <Button variant="ghost" size="sm" loading={diagnosing} disabled={!upn} onClick={onDiagnoseAgain}>
            Diagnose again
          </Button>
        </div>

        {!upn && <p className="-mt-2 text-sm text-ink-3">Run Diagnose with a Global Admin UPN above to fill the form and unlock Create.</p>}
        {create.data && (
          <p role="status" className="rounded-[var(--radius-paper)] border border-ok/40 bg-ok-wash px-3 py-2 text-sm text-ink">
            <span className="font-semibold">{create.data.outcome === 'created' ? 'Created' : 'Matched'}:</span> {create.data.distinguishedName}. {create.data.message}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmCreate}
        onClose={() => setConfirmCreate(false)}
        onConfirm={() => {
          const body = validated()
          return body ? create.mutateAsync(body) : undefined
        }}
        title="Create or match synced admin?"
        body={
          <>
            Creates <span className="font-semibold text-ink">{form.samAccountName}</span> in on-premises AD under{' '}
            <span className="font-semibold text-ink">{form.ouDn}</span> matching <span className="font-semibold text-ink">{upn}</span>, or
            matches an existing account. The next sync links it to the cloud admin.
          </>
        }
        confirmLabel="Create / match"
      />
    </details>
  )
}
