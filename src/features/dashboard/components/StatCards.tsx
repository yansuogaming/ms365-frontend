import { BadgeCheck, Smartphone, Users, UsersRound, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatNumber } from '@/components/ui/admin'
import type { DashboardSummary } from '../types'
import { Spinner } from '@/components/ui/Loader'

function Stat({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: number | null | undefined; note?: ReactNode }) {
  return (
    <div className="paper-shadow flex min-w-0 flex-col gap-3 rounded-[var(--radius-paper)] border border-line bg-paper p-4 sm:gap-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink-2 sm:gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-coral-wash text-coral-ink">
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </span>
        {label}
      </div>
      <div>
        {value === undefined ? (
          <span role="status" aria-label={`Loading ${label.toLowerCase()}`} className="flex h-[1.6rem] items-center sm:h-[2.1rem]">
            <Spinner size="sm" />
          </span>
        ) : (
          <p className="tabular font-display text-[1.6rem] leading-none font-semibold sm:text-[2.1rem]">{value === null ? '—' : formatNumber(value)}</p>
        )}
        <p className="mt-2 min-h-5 text-xs text-ink-3 sm:text-sm">{value === null ? 'Not reported' : note}</p>
      </div>
    </div>
  )
}

/** Four headline counts. `summary` undefined = still loading. */
export function StatCards({ summary }: { summary?: DashboardSummary }) {
  const s = summary
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Stat
        icon={Users}
        label="Total users"
        value={s ? s.users.total : undefined}
        note={s?.users.addedLast7Days != null && `${formatNumber(s.users.addedLast7Days)} added in the last 7 days`}
      />
      <Stat
        icon={BadgeCheck}
        label="Licenses used"
        value={s ? s.licenses.used : undefined}
        note={s?.licenses.available != null && `${formatNumber(s.licenses.available)} available`}
      />
      <Stat icon={UsersRound} label="Groups" value={s ? s.groups.total : undefined} />
      <Stat
        icon={Smartphone}
        label="Managed devices"
        value={s ? s.devices.managed : undefined}
        note={
          s?.devices.nonCompliant != null &&
          (s.devices.nonCompliant > 0 ? <span className="font-semibold text-warn">{formatNumber(s.devices.nonCompliant)} non-compliant</span> : 'All compliant')
        }
      />
    </div>
  )
}
