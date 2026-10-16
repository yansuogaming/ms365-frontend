import { Lightbulb } from 'lucide-react'
import { InfoTip } from '@/components/ui/InfoTip'
import { Select } from '@/components/ui/Select'

/** Entra accepts 10 minutes to 30 days; a tenant policy may narrow it further. */
export const TAP_MIN = 10
export const TAP_MAX = 43_200
/** Used by the one-click TAP in the bulk bar. */
export const TAP_DEFAULT_MINUTES = 60

export function tapLifetimeError(minutes: string) {
  const n = Number(minutes)
  return Number.isInteger(n) && n >= TAP_MIN && n <= TAP_MAX ? null : `Between ${TAP_MIN} and ${TAP_MAX.toLocaleString('en-US')} minutes (30 days).`
}

/** What a TAP is: shared by the TAP dialog title and the 2FA dialog. */
export const tapExplainer = (
  <>
    <span className="block">Temporary Access Pass = a temporary 8-digit code. The admin creates it and gives it to the user, who uses it once as the password. Microsoft then automatically makes the user set up the Authenticator app, and push notifications work from then on.</span>
    <span className="mt-2 block">This is Microsoft’s official way for an admin to bootstrap MFA. The tenant must have the TAP policy turned on.</span>
  </>
)

function Label({ children, tip }: { children: string; tip: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold">
      {children}
      <InfoTip label={`About ${children.toLowerCase()}`}>{tip}</InfoTip>
    </span>
  )
}

interface TapFieldsProps {
  minutes: string
  onMinutes: (v: string) => void
  oneTime: boolean
  onOneTime: (v: boolean) => void
  error?: string | null
}

/** Lifetime + usage + the tenant requirement note, as in the original console. */
export function TapFields({ minutes, onMinutes, oneTime, onOneTime, error }: TapFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label tip={`How long the pass works, in minutes. Microsoft allows ${TAP_MIN} to ${TAP_MAX.toLocaleString('en-US')} (30 days); the tenant policy may set a narrower range. 60 is a good default.`}>Lifetime (minutes)</Label>
          <input
            type="number"
            inputMode="numeric"
            min={TAP_MIN}
            max={TAP_MAX}
            step={10}
            value={minutes}
            onChange={(e) => onMinutes(e.target.value)}
            aria-label="Lifetime in minutes"
            aria-invalid={Boolean(error)}
            className={`h-12 w-full rounded-[var(--radius-paper)] border bg-paper px-4 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] ${
              error ? 'border-danger' : 'border-line hover:border-ink-3'
            }`}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label tip="One-time: the pass works for a single sign-in, which is all that is needed to set up Authenticator (recommended). Multi-use: it keeps working until it expires.">Usage</Label>
          <Select
            label="Usage"
            variant="field"
            value={oneTime ? 'once' : 'multi'}
            onChange={(v) => onOneTime(v === 'once')}
            options={[
              { value: 'once', label: 'One-time', hint: 'Recommended' },
              { value: 'multi', label: 'Multi-use' },
            ]}
          />
        </div>
      </div>

      <p className="flex items-start gap-2.5 rounded-[var(--radius-paper)] border border-warn/40 bg-warn-wash px-3.5 py-3 text-sm text-ink-2">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
        <span>
          <b className="font-semibold text-ink">Tenant requirement:</b> the Authentication Methods Policy must have TAP turned on. If it is not, the request fails with 403; an admin enables it in Entra admin center → Protection → Authentication methods → Temporary Access Pass → Enable.
        </span>
      </p>
    </div>
  )
}
