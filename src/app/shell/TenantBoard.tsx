import type { SessionTenant } from '@/features/auth/types'

/**
 * The lobby directory strip: the active tenant set in pressed-in letters
 * inside a brass frame. Letters press in one by one when the board mounts.
 */
export function TenantBoard({ tenant }: { tenant: SessionTenant }) {
  const name = tenant.displayName || tenant.domain

  return (
    <div
      className="mx-3.5 rounded-[3px] border-[3px] border-brass bg-felt px-3 py-2.5 shadow-[inset_0_2px_6px_rgb(0_0_0/0.55)]"
      aria-label={`Active tenant: ${name}, ${tenant.domain}`}
    >
      <p
        aria-hidden
        className="font-board text-[19px] leading-[1.15] font-bold tracking-[0.06em] text-letter uppercase [overflow-wrap:anywhere]"
      >
        {Array.from(name).map((ch, i) => (
          <span key={i} className="letter-press" style={{ ['--i' as string]: i }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </p>
      <p aria-hidden className="mt-1 truncate font-board text-[12px] font-semibold tracking-[0.08em] text-letter-muted">
        {tenant.domain}
      </p>
    </div>
  )
}
