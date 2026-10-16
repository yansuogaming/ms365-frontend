import { RefreshCw, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Field } from '@/components/ui/Field'
import { FormSection } from '@/components/ui/FormSection'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Select } from '@/components/ui/Select'
import { notify } from '@/components/ui/Toaster'
import { countryOptions } from '@/lib/countries'
import { generatePassword, generateUsername, passwordProblem, passwordStyles, type PasswordStyle } from '@/lib/random'
import { useGroupOptions, useOrgProfile, useRoleDefinitions, usersApi, useSkus, useUserMutation } from '../api'
import { CredentialResults } from '../dialogs/CredentialResults'
import type { CreateUserRequest } from '../types'
import { Loading } from '@/components/ui/Loader'

type NameMode = 'fixed' | 'username' | 'auto'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LOCAL = /^[a-z0-9][a-z0-9._'-]{0,63}$/i

function randomDisplayName() {
  return `User ${generateUsername(5).toUpperCase()}`
}

/** Member tab of Create user: form state, view, submit and the one-time result. */
export function useMemberForm(onCreated: () => void) {
  const org = useOrgProfile(true).data
  const skus = useSkus().data ?? []
  const groups = useGroupOptions(true)
  const roles = useRoleDefinitions(true)

  const domains = org?.domains.filter((d) => d.isVerified) ?? []
  const defaultDomain = domains.find((d) => d.isDefault)?.name ?? domains[0]?.name ?? ''

  const [mode, setMode] = useState<NameMode>('username')
  const [fixedName, setFixedName] = useState('')
  const [autoName, setAutoName] = useState(randomDisplayName)
  const [username, setUsername] = useState('')
  const [domainPick, setDomain] = useState('')
  const domain = domainPick || defaultDomain
  const [style, setStyle] = useState<PasswordStyle>('simple')
  const [password, setPassword] = useState(() => generatePassword('simple'))
  const [forceChange, setForceChange] = useState(false)
  const [usageLocation, setUsageLocation] = useState('')
  const [skuIds, setSkuIds] = useState<string[]>([])
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [roleSearch, setRoleSearch] = useState('')
  const [sendTo, setSendTo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<{ upn: string; password: string; emailedTo?: string } | null>(null)

  const location = usageLocation || org?.country || 'US'
  const displayName = mode === 'fixed' ? fixedName.trim() : mode === 'username' ? username.trim() : autoName

  const create = useUserMutation(
    (body: CreateUserRequest) => usersApi.create(body),
    (user, body) => {
      setCreated({ upn: user.upn, password: body.password, emailedTo: body.sendCredentialsTo })
      notify.success(`Created ${user.upn}`, { description: body.sendCredentialsTo ? `Sign-in details sent to ${body.sendCredentialsTo}.` : undefined })
      onCreated()
    },
  )

  function submit() {
    const e: Record<string, string> = {}
    if (!LOCAL.test(username.trim())) e.username = 'Letters, numbers and . _ - only; start with a letter or number.'
    if (!domain) e.username = e.username ?? 'Pick a domain.'
    if (!displayName) e.displayName = 'Enter a display name or pick another mode.'
    const pw = passwordProblem(password)
    if (pw) e.password = pw
    if (sendTo.trim() && !EMAIL.test(sendTo.trim())) e.sendTo = 'Enter a valid email address.'
    setErrors(e)
    if (Object.keys(e).length) return
    create.mutate({
      displayName,
      upnLocal: username.trim().toLowerCase(),
      domain,
      password,
      forceChangePassword: forceChange,
      usageLocation: location,
      skuIds,
      groupIds,
      roleIds,
      ...(sendTo.trim() && { sendCredentialsTo: sendTo.trim() }),
    })
  }

  function reset() {
    setCreated(null)
    setUsername('')
    setFixedName('')
    setAutoName(randomDisplayName())
    setPassword(generatePassword(style))
    setSkuIds([])
    setGroupIds([])
    setRoleIds([])
    setSendTo('')
    create.reset()
  }

  const visibleRoles = (roles.data ?? []).filter((r) => r.name.toLowerCase().includes(roleSearch.trim().toLowerCase()))
  const fieldBox =
    'h-12 w-full rounded-[var(--radius-paper)] border bg-paper px-4 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] disabled:bg-paper-2 disabled:text-ink-2'

  const view = created ? (
    <div className="flex flex-col gap-4">
      <p className="text-ink-2">
        <span className="font-semibold text-ink">{created.upn}</span> is ready.
        {created.emailedTo && <> The sign-in details were also sent to {created.emailedTo}.</>}
      </p>
      <CredentialResults results={[{ upn: created.upn, secret: created.password }]} kind="password" />
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      <FormSection title="Identity">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="flex flex-col gap-2">
            <label htmlFor="cu-display" className="text-sm font-semibold">
              Display name
            </label>
            <input
              id="cu-display"
              disabled={mode !== 'fixed'}
              value={mode === 'fixed' ? fixedName : ''}
              onChange={(e) => setFixedName(e.target.value)}
              placeholder={mode === 'username' ? username || 'Same as the username' : mode === 'auto' ? autoName : 'Jane Doe'}
              className={`${fieldBox} ${errors.displayName ? 'border-danger' : 'border-line hover:border-ink-3'}`}
            />
            {errors.displayName && <p className="text-sm text-danger">{errors.displayName}</p>}
          </div>
          <Select
            label="Mode"
            showLabel
            variant="field"
            value={mode}
            onChange={(m) => {
              setMode(m)
              if (m === 'auto') setAutoName(randomDisplayName())
            }}
            options={[
              { value: 'fixed', label: 'Fixed text' },
              { value: 'username', label: 'Use username' },
              { value: 'auto', label: 'Auto generated' },
            ]}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="cu-username" className="text-sm font-semibold">
            Username
          </label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.1fr)_auto] sm:items-center">
            <input
              id="cu-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="john.doe"
              autoComplete="off"
              spellCheck={false}
              className={`${fieldBox} ${errors.username ? 'border-danger' : 'border-line hover:border-ink-3'}`}
            />
            <span className="hidden text-ink-3 sm:block">@</span>
            <Select
              label="Domain"
              variant="field"
              value={domain}
              onChange={setDomain}
              options={domains.length ? domains.map((d) => ({ value: d.name, label: d.name })) : [{ value: '', label: 'Loading domains…' }]}
            />
            <Button type="button" variant="secondary" className="h-12" onClick={() => setUsername(generateUsername())}>
              <Shuffle className="size-4" aria-hidden />
              Random
            </Button>
          </div>
          {errors.username ? (
            <p className="text-sm text-danger">{errors.username}</p>
          ) : (
            username && domain && <p className="text-sm text-ink-3">Signs in as {username.trim().toLowerCase()}@{domain}</p>
          )}
        </div>
      </FormSection>

      <FormSection title="Password" tone="ink">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
          <input
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            spellCheck={false}
            className={`${fieldBox} tabular ${errors.password ? 'border-danger' : 'border-line hover:border-ink-3'}`}
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
          <Button type="button" variant="secondary" className="h-12" onClick={() => setPassword(generatePassword(style))}>
            <RefreshCw className="size-4" aria-hidden />
            Random
          </Button>
        </div>
        {errors.password && <p className="mt-2 text-sm text-danger">{errors.password}</p>}
        <Checkbox checked={forceChange} onChange={setForceChange} label="Require password change at next sign-in" className="mt-3" />
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
              return { value: s.skuId, label: s.name, hint: free > 0 ? `${free} free` : 'none free', disabled: free <= 0 }
            })}
          />
          <MultiSelect
            label="Add to groups"
            optional
            className="sm:col-span-2"
            value={groupIds}
            onChange={setGroupIds}
            placeholder="Select groups…"
            emptyText="No groups found."
            loading={groups.isPending}
            options={(groups.data ?? []).map((g) => ({ value: g.id, label: g.displayName, hint: g.kind }))}
            searchPlaceholder="Search name or group id…"
          />
          <Field
            label="Send credentials to email (optional)"
            type="email"
            className="sm:col-span-2"
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
            placeholder="recipient@example.com"
            error={errors.sendTo}
            autoComplete="off"
          />
        </div>
      </FormSection>

      <FormSection title="Admin roles" tone="warn" optional aside={<span className="text-xs text-ink-3">{roleIds.length ? `${roleIds.length} selected` : 'No roles'}</span>}>
        <div className="flex gap-2">
          <input
            aria-label="Search roles"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Search roles…"
            className={`${fieldBox} h-10 border-line text-sm hover:border-ink-3`}
          />
          <Button type="button" variant="secondary" size="sm" className="h-10" disabled={!roleIds.length} onClick={() => setRoleIds([])}>
            Clear
          </Button>
        </div>
        {/* fixed height: real tenants have 100+ roles; the list scrolls, not the dialog */}
        <div className="mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-[var(--radius-paper)] border border-line p-1">
          {roles.isPending ? (
            <Loading variant="inline" label="Loading roles…" />
          ) : visibleRoles.length === 0 ? (
            <p className="p-3 text-sm text-ink-3">{roles.data?.length ? `No role matches “${roleSearch}”.` : 'No admin roles loaded for this tenant.'}</p>
          ) : (
            visibleRoles.map((r) => (
              <Checkbox
                key={r.id}
                checked={roleIds.includes(r.id)}
                onChange={(on) => setRoleIds((ids) => (on ? [...ids, r.id] : ids.filter((x) => x !== r.id)))}
                label={r.name}
                className="rounded-md px-2.5 py-2 hover:bg-paper-2"
              />
            ))
          )}
        </div>
      </FormSection>
    </div>
  )

  return { view, submit, busy: create.isPending, created: Boolean(created), reset }
}
