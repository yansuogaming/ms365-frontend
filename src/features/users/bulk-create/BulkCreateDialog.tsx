import { RefreshCw, RotateCcw, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormSection } from '@/components/ui/FormSection'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Select } from '@/components/ui/Select'
import { notify } from '@/components/ui/Toaster'
import { countryOptions } from '@/lib/countries'
import { generatePassword, passwordProblem, passwordStyles, type PasswordStyle } from '@/lib/random'
import { useGroupOptions, useOrgProfile, usersApi, useSkus, useUserMutation } from '../api'
import { CredentialResults } from '../dialogs/CredentialResults'
import { FormDialog } from '../dialogs/FormDialog'
import type { BulkCreateRequest, CredentialResult, DisplayNameMode } from '../types'

export const BULK_MAX = 500
const PREFIX = /^[a-z0-9][a-z0-9._-]{0,40}$/i

/**
 * The last run's results, kept in memory only (gone on reload) so "Recover"
 * can show them again if the dialog was closed before they were saved.
 */
let lastRun: { results: CredentialResult[]; at: Date } | null = null

const fieldBox =
  'h-12 w-full rounded-[var(--radius-paper)] border bg-paper px-4 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] disabled:bg-paper-2 disabled:text-ink-3'
const border = (bad?: string) => (bad ? 'border-danger' : 'border-line hover:border-ink-3')

const modeHint: Record<DisplayNameMode, string> = {
  fixed: 'Fixed text uses exactly this display name for every new user.',
  username: 'Each user gets their own username as the display name.',
  auto: 'Each user gets a generated name.',
}

function Label({ htmlFor, children }: { htmlFor?: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold">
      {children}
    </label>
  )
}

export function BulkCreateDialog({ onClose }: { onClose: () => void }) {
  const org = useOrgProfile(true).data
  const skus = useSkus().data ?? []
  const groups = useGroupOptions(true)
  const domains = org?.domains.filter((d) => d.isVerified) ?? []
  const defaultDomain = domains.find((d) => d.isDefault)?.name ?? domains[0]?.name ?? ''

  const [prefix, setPrefix] = useState('user')
  const [count, setCount] = useState('5')
  const [domainPick, setDomain] = useState('')
  const domain = domainPick || defaultDomain
  const [mode, setMode] = useState<DisplayNameMode>('fixed')
  const [fixedName, setFixedName] = useState('')
  const [randomUsernames, setRandomUsernames] = useState(false)
  const [style, setStyle] = useState<PasswordStyle>('simple')
  const [password, setPassword] = useState(() => generatePassword('simple'))
  const [randomPerUser, setRandomPerUser] = useState(false)
  const [forceChange, setForceChange] = useState(false)
  const [usageLocation, setUsageLocation] = useState('')
  const location = usageLocation || org?.country || 'US'
  const [skuIds, setSkuIds] = useState<string[]>([])
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [results, setResults] = useState<CredentialResult[] | null>(null)

  const n = Number(count)
  const run = useUserMutation(
    (body: BulkCreateRequest) => usersApi.bulkCreate(body),
    ({ results }) => {
      lastRun = { results, at: new Date() }
      setResults(results)
      const ok = results.filter((r) => r.secret).length
      if (ok === results.length) notify.success(`Created ${ok} user${ok === 1 ? '' : 's'}`)
      else if (ok > 0) notify.warning(`Created ${ok} of ${results.length} users`, { description: 'The failed ones are listed with the reason.' })
      else notify.error('No user was created', { description: 'Each row lists the reason.' })
    },
  )

  function submit() {
    const e: Record<string, string> = {}
    if (!randomUsernames && !PREFIX.test(prefix.trim())) e.prefix = 'Letters, numbers and . _ - only; start with a letter or number.'
    if (!Number.isInteger(n) || n < 1 || n > BULK_MAX) e.count = `1 to ${BULK_MAX}.`
    if (!domain) e.domain = 'Pick a domain.'
    if (mode === 'fixed' && !fixedName.trim()) e.displayName = 'Enter the display name, or pick another mode.'
    if (!randomPerUser) {
      const pw = passwordProblem(password)
      if (pw) e.password = pw
    }
    setErrors(e)
    if (Object.keys(e).length) return
    run.mutate({
      prefix: prefix.trim().toLowerCase(),
      count: n,
      domain,
      randomUsernames,
      displayName: mode === 'fixed' ? { mode, value: fixedName.trim() } : { mode },
      ...(randomPerUser ? {} : { password }),
      randomPasswordPerUser: randomPerUser,
      forceChangePassword: forceChange,
      usageLocation: location,
      skuIds,
      groupIds,
    })
  }

  function createMore() {
    setResults(null)
    setPassword(generatePassword(style))
    run.reset()
  }

  const ok = results?.filter((r) => r.secret).length ?? 0
  const example = !randomUsernames && PREFIX.test(prefix.trim()) && domain ? `${prefix.trim().toLowerCase()}1@${domain}` : null

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Bulk create users"
      description={results ? `${ok} of ${results.length} created. The passwords are shown only here.` : 'Generate multiple accounts in one run: passwords, licenses and groups included.'}
      submitLabel="Create users"
      onSubmit={submit}
      busy={run.isPending}
      size="lg"
      footer={
        results ? (
          <>
            <Button type="button" variant="secondary" onClick={createMore}>
              Create more
            </Button>
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!lastRun || run.isPending}
              title={lastRun ? `Show the results of the last run (${lastRun.at.toLocaleTimeString()})` : 'No earlier run in this tab'}
              aria-label="Recover the last results"
              onClick={() => lastRun && setResults(lastRun.results)}
              className="px-4 sm:px-5"
            >
              <RotateCcw className="size-4" aria-hidden />
              <span className="hidden sm:inline">Recover</span>
            </Button>
            <Button type="submit" loading={run.isPending}>
              {!run.isPending && <UsersRound className="size-4" aria-hidden />}
              {n > 0 && n <= BULK_MAX ? (
                <>
                  Create {n}
                  <span className="hidden sm:inline">user{n === 1 ? '' : 's'}</span>
                </>
              ) : (
                'Create users'
              )}
            </Button>
          </>
        )
      }
    >
      {results ? (
        <CredentialResults results={results} kind="password" />
      ) : (
        <div className="flex flex-col gap-4">
          <FormSection title="Identity">
            <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-4 sm:grid-cols-[minmax(0,1.2fr)_7rem_minmax(0,1.4fr)]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bc-prefix">Username prefix</Label>
                <input
                  id="bc-prefix"
                  value={randomUsernames ? '' : prefix}
                  disabled={randomUsernames}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder={randomUsernames ? 'firstname.lastname' : 'user'}
                  autoComplete="off"
                  spellCheck={false}
                  className={`${fieldBox} ${border(errors.prefix)}`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bc-count">Count</Label>
                <input
                  id="bc-count"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={BULK_MAX}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className={`${fieldBox} tabular ${border(errors.count)}`}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Domain"
                  showLabel
                  variant="field"
                  value={domain}
                  onChange={setDomain}
                  options={domains.length ? domains.map((d) => ({ value: d.name, label: d.name })) : [{ value: '', label: 'Loading domains…' }]}
                />
              </div>
            </div>
            {(errors.prefix || errors.count || errors.domain) && <p className="mt-2 text-sm text-danger">{[errors.prefix, errors.count && `Count: ${errors.count}`, errors.domain].filter(Boolean).join(' ')}</p>}

            <div className="mt-4 grid gap-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
              <Select
                label="Display name"
                showLabel
                variant="field"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'fixed', label: 'Fixed text' },
                  { value: 'username', label: 'Use username' },
                  { value: 'auto', label: 'Auto generated' },
                ]}
              />
              <div className="flex flex-col gap-2">
                <Label htmlFor="bc-value">Value</Label>
                <input
                  id="bc-value"
                  value={mode === 'fixed' ? fixedName : ''}
                  disabled={mode !== 'fixed'}
                  onChange={(e) => setFixedName(e.target.value)}
                  placeholder={mode === 'fixed' ? 'e.g. Class 8A' : mode === 'username' ? 'Same as each username' : 'Generated per user'}
                  className={`${fieldBox} ${border(errors.displayName)}`}
                />
              </div>
            </div>
            <p className={`mt-2 text-sm ${errors.displayName ? 'text-danger' : 'text-ink-3'}`}>{errors.displayName ?? modeHint[mode]}</p>

            <Checkbox
              checked={randomUsernames}
              onChange={setRandomUsernames}
              className="mt-3"
              label={
                <span>
                  Random usernames <span className="text-ink-3">(firstname.lastname, ignores the prefix)</span>
                </span>
              }
            />
            {example && <p className="mt-2 text-sm text-ink-3">Usernames are numbered, e.g. {example}; numbers already taken are skipped.</p>}
          </FormSection>

          <FormSection title="Password" tone="ink">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
              <input
                aria-label="Password"
                value={randomPerUser ? '' : password}
                disabled={randomPerUser}
                placeholder={randomPerUser ? 'A different one for each user' : ''}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                spellCheck={false}
                className={`${fieldBox} tabular ${border(errors.password)}`}
              />
              <Select
                label="Password style"
                variant="field"
                value={style}
                onChange={(s) => {
                  setStyle(s)
                  setPassword(generatePassword(s))
                }}
                options={passwordStyles}
              />
              <Button type="button" variant="secondary" className="h-12" disabled={randomPerUser} onClick={() => setPassword(generatePassword(style))}>
                <RefreshCw className="size-4" aria-hidden />
                Random
              </Button>
            </div>
            {errors.password && <p className="mt-2 text-sm text-danger">{errors.password}</p>}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
              <Checkbox
                checked={randomPerUser}
                onChange={setRandomPerUser}
                label={
                  <span>
                    Random unique password per user <span className="text-ink-3">(ignores the one above)</span>
                  </span>
                }
              />
              <Checkbox checked={forceChange} onChange={setForceChange} label="Require password change at next sign-in" />
            </div>
          </FormSection>

          <FormSection title="Assignment" tone="ok">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Usage location" showLabel variant="field" value={location} onChange={setUsageLocation} options={countryOptions} />
              <MultiSelect
                label="License"
                optional
                value={skuIds}
                onChange={setSkuIds}
                placeholder="Select licenses…"
                emptyText="No license plans in this tenant."
                options={skus.map((s) => {
                  const free = s.enabled - s.consumed
                  return { value: s.skuId, label: s.name, hint: free > 0 ? `${free.toLocaleString('en-US')} available` : 'none free', disabled: free <= 0 }
                })}
              />
              <MultiSelect
                label="Add to groups"
                optional
                className="sm:col-span-2"
                value={groupIds}
                onChange={setGroupIds}
                placeholder="Select groups…"
                searchPlaceholder="Search name or group id…"
                emptyText="No groups found."
                loading={groups.isPending}
                options={(groups.data ?? []).map((g) => ({ value: g.id, label: g.displayName, hint: g.kind }))}
              />
            </div>
            {skuIds.length > 0 && n > 0 && <p className="mt-3 text-sm text-ink-3">Each license is needed {n.toLocaleString('en-US')} times; users beyond the available seats are created without it and listed as failed for the license.</p>}
          </FormSection>
        </div>
      )}
    </FormDialog>
  )
}
