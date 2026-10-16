import { ChevronDown, Mail, Smartphone, Ticket, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { InfoTip } from '@/components/ui/InfoTip'
import { Select } from '@/components/ui/Select'
import { dialOptions, findCountry } from '@/lib/countries'
import { notify } from '@/components/ui/Toaster'
import { reportBulk, usersApi, useUserMutation } from '../api'
import type { CredentialResult, TwoFactorMethod, UserRow } from '../types'
import { tapExplainer, TapFields, tapLifetimeError } from './TapFields'
import { CredentialResults } from './CredentialResults'
import { FormDialog, who } from '@/components/ui/FormDialog'

/** Help text for each method, from the original console (translated). */
const tips = {
  phone: (
    <>
      <span className="block">Pick the country and type the number. The admin adds it, Graph accepts it, and Microsoft texts a code when the user signs in. Works right away; the user does not need to do anything.</span>
      <span className="mt-2 block">Less secure than TOTP (SIM-swap risk), but the admin can set it up completely alone.</span>
    </>
  ),
  email: (
    <>
      <span className="block">Adds a password-recovery email (otherMails) for the user.</span>
      <span className="mt-2 block">The user can use this email to reset their password through Microsoft 365 Self-Service Password Reset (SSPR).</span>
      <span className="mt-2 block">Set directly by the admin through the Graph API; works right away.</span>
    </>
  ),
}

/** National part of a phone number: separators removed, trunk 0 dropped (0901… → 901…). */
const national = (v: string) => v.replace(/[\s().-]/g, '').replace(/^0+/, '')
const PHONE = /^[0-9]{6,14}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface MethodCardProps {
  icon: LucideIcon
  title: string
  tip: ReactNode
  badge?: string
  tone: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

function MethodCard({ icon: Icon, title, tip, badge, tone, open, onToggle, children }: MethodCardProps) {
  return (
    <section className={`rounded-[var(--radius-paper)] border transition-colors ${open ? 'border-ink-3 bg-paper' : 'border-line bg-paper hover:border-ink-3'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}>
            <Icon className="size-[18px]" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="font-semibold">{title}</span>
            {badge && <span className="shrink-0 rounded-full bg-coral-wash px-2 py-0.5 text-[11px] font-semibold tracking-wide text-coral-ink uppercase">{badge}</span>}
          </span>
        </button>
        <InfoTip label={`About ${title}`}>{tip}</InfoTip>
        <ChevronDown className={`size-4 shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </div>
      {open && <div className="border-t border-line px-4 py-4">{children}</div>}
    </section>
  )
}

function FieldLabel({ children, tip }: { children: string; tip?: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold">
      {children}
      {tip && <InfoTip label={`About ${children.toLowerCase()}`}>{tip}</InfoTip>}
    </span>
  )
}

/** One input per selected user (phone numbers and emails differ per person). */
function PerUserInputs({
  users,
  values,
  onChange,
  placeholder,
  type,
  invalid,
  prefix,
}: {
  users: UserRow[]
  values: Record<string, string>
  onChange: (id: string, v: string) => void
  placeholder: string
  type: 'tel' | 'email'
  invalid: (v: string) => boolean
  prefix?: string
}) {
  const single = users.length === 1
  return (
    <ul className={`flex flex-col gap-2 ${single ? '' : 'max-h-64 overflow-y-auto overscroll-contain'}`}>
      {users.map((u) => {
        const v = values[u.id] ?? ''
        const bad = v !== '' && invalid(v)
        return (
          <li key={u.id} className={single ? '' : 'grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center sm:gap-3'}>
            {!single && (
              <span className="truncate text-sm text-ink-2" title={u.upn}>
                {u.upn}
              </span>
            )}
            <div
              className={`flex h-11 overflow-hidden rounded-[var(--radius-paper)] border bg-paper transition-[border-color,box-shadow] focus-within:border-coral focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] ${
                bad ? 'border-danger' : 'border-line hover:border-ink-3'
              }`}
            >
              {prefix && <span className="tabular grid shrink-0 place-items-center border-r border-line bg-paper-2 px-3 text-sm font-semibold text-coral-ink">{prefix}</span>}
              <input
                type={type}
                inputMode={type === 'tel' ? 'tel' : 'email'}
                aria-label={`${type === 'tel' ? 'Phone number' : 'Recovery email'} for ${u.upn}`}
                aria-invalid={bad}
                value={v}
                onChange={(e) => onChange(u.id, e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-3"
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function TwoFactorDialog({ users, onClose, onDone }: { users: UserRow[]; onClose: () => void; onDone: () => void }) {
  const [open, setOpen] = useState<TwoFactorMethod | null>('tap')
  const toggle = (m: TwoFactorMethod) => setOpen((o) => (o === m ? null : m))

  // TAP
  const [minutes, setMinutes] = useState('60')
  const [tapTouched, setTapTouched] = useState(false)
  const lifetimeError = tapLifetimeError(minutes)
  const [oneTime, setOneTime] = useState(true)
  const [passes, setPasses] = useState<CredentialResult[] | null>(null)
  const tap = useUserMutation(
    () => usersApi.createTap(users.map((u) => u.id), Number(minutes), oneTime),
    (r) => {
      setPasses(r.results)
      const ok = r.results.filter((x) => x.secret).length
      if (ok === r.results.length) notify.success(`Temporary Access Pass created for ${ok} user${ok === 1 ? '' : 's'}`)
      else notify.warning(`TAP created for ${ok} of ${r.results.length}`)
      onDone()
    },
  )

  // SMS phone and recovery email: one value per user
  const [phones, setPhones] = useState<Record<string, string>>({})
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [country, setCountry] = useState('VN')
  const { dial } = findCountry(country)
  // Graph expects "+{country code} {number}", e.g. "+84 901234567"
  const phoneEntries = users.filter((u) => phones[u.id]?.trim()).map((u) => ({ id: u.id, phoneNumber: `${dial} ${national(phones[u.id])}` }))
  const emailEntries = users.filter((u) => emails[u.id]?.trim()).map((u) => ({ id: u.id, email: emails[u.id].trim() }))
  const phonesValid = phoneEntries.length > 0 && users.every((u) => !phones[u.id]?.trim() || PHONE.test(national(phones[u.id])))
  const emailsValid = emailEntries.length > 0 && emailEntries.every((e) => EMAIL.test(e.email))

  const phone = useUserMutation(
    () => usersApi.setMfaPhone(phoneEntries),
    (r) => {
      reportBulk('Added a phone method for', r)
      onDone()
    },
  )
  const email = useUserMutation(
    () => usersApi.setMfaEmail(emailEntries),
    (r) => {
      reportBulk('Set the recovery email for', r)
      onDone()
    },
  )

  const names = who(users.map((u) => u.displayName))

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Setup 2FA · ${names}`}
      description={
        <span className="flex items-center gap-1.5">
          {users.length === 1 ? users[0].upn : `${users.length} users selected`}
          <InfoTip label="About 2FA setup">
            <span className="block">Choose an MFA / security method for the selected users.</span>
            <span className="mt-2 block">
              <b>TAP</b>: the admin bootstraps the Authenticator app (recommended).
            </span>
            <span className="block">
              <b>SMS Phone</b>: the admin adds a phone number.
            </span>
            <span className="block">
              <b>Recovery Email</b>: an email for self-service password reset (SSPR).
            </span>
          </InfoTip>
        </span>
      }
      submitLabel="Close"
      onSubmit={onClose}
      size="md"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <MethodCard
          icon={Ticket}
          title="TAP — Bootstrap Authenticator app"
          badge="Recommended"
          tone="bg-coral-wash text-coral-ink"
          open={open === 'tap'}
          onToggle={() => toggle('tap')}
          tip={tapExplainer}
        >
          {passes ? (
            <CredentialResults results={passes} kind="pass" />
          ) : (
            <div className="flex flex-col gap-4">
              <TapFields minutes={minutes} onMinutes={setMinutes} oneTime={oneTime} onOneTime={setOneTime} error={tapTouched ? lifetimeError : null} />
              <Button type="button" className="self-start" loading={tap.isPending}
                onClick={() => {
                  setTapTouched(true)
                  if (!lifetimeError) tap.mutate(undefined)
                }}
              >
                Create pass{users.length > 1 ? `es (${users.length})` : ''}
              </Button>
            </div>
          )}
        </MethodCard>

        <MethodCard
          icon={Smartphone}
          title="SMS Phone (admin-driven)"
          tone="bg-ok-wash text-ok"
          open={open === 'phone'}
          onToggle={() => toggle('phone')}
          tip={tips.phone}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel>Country</FieldLabel>
              <Select
                label="Country"
                variant="field"
                value={country}
                onChange={setCountry}
                options={dialOptions}
                display={
                  <>
                    <span className="mr-2.5 text-xs font-semibold text-ink-3">{country}</span>
                    {findCountry(country).name}
                    <span className="tabular ml-2.5 text-ink-3">{dial}</span>
                  </>
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel tip={`Type the number without the country code; a leading 0 is dropped (0901 234 567 becomes ${dial} 901234567).`}>{users.length > 1 ? 'Phone numbers' : 'Phone number'}</FieldLabel>
              <PerUserInputs users={users} values={phones} onChange={(id, v) => setPhones({ ...phones, [id]: v })} placeholder="901234567" type="tel" prefix={dial} invalid={(v) => !PHONE.test(national(v))} />
            </div>
            <Button type="button" className="self-start" disabled={!phonesValid} loading={phone.isPending} onClick={() => phone.mutate(undefined)}>
              Add phone{phoneEntries.length > 1 ? `s (${phoneEntries.length})` : ''} & enable SMS
            </Button>
          </div>
        </MethodCard>

        <MethodCard
          icon={Mail}
          title="Recovery Email — Password recovery (SSPR)"
          tone="bg-paper-3 text-ink-2"
          open={open === 'email'}
          onToggle={() => toggle('email')}
          tip={tips.email}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel>{users.length > 1 ? 'Password recovery emails (SSPR)' : 'Password recovery email (SSPR)'}</FieldLabel>
              <PerUserInputs users={users} values={emails} onChange={(id, v) => setEmails({ ...emails, [id]: v })} placeholder="recovery@example.com" type="email" invalid={(v) => !EMAIL.test(v.trim())} />
              <p className="text-sm text-ink-3">
                Used for <b className="font-semibold text-ink-2">Self-Service Password Reset</b>. The user can reset their password through the Microsoft 365 portal without contacting an admin.
              </p>
            </div>
            <Button type="button" className="self-start" disabled={!emailsValid} loading={email.isPending} onClick={() => email.mutate(undefined)}>
              Save email{emailEntries.length > 1 ? `s (${emailEntries.length})` : ''}
            </Button>
          </div>
        </MethodCard>
      </div>
    </FormDialog>
  )
}
