import { useEffect, useState, type ReactNode } from 'react'

/**
 * The one loading indicator for the whole app.
 *
 *   <Spinner />                          the mark alone (buttons, tight spots)
 *   <Loading label="Loading users…" />   panels, tables, dialogs, list boxes
 *   <RouteProgress active />             thin bar under the header while a page loads
 *   <ScreenLoader label="…" />           full screen, before the app shell exists
 *
 * Every variant waits ~150 ms before appearing, so quick responses never flash.
 */

const sizes = { sm: 'size-5', md: 'size-9', lg: 'size-14' }

/** Two counter-rotating arcs: coral outside, ink inside, a dot breathing in the middle. */
export function Spinner({ size = 'md', className = '' }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={`${sizes[size]} shrink-0 ${className}`}>
      <circle cx="24" cy="24" r="20" stroke="var(--line)" strokeWidth="3.5" />
      {/* circumference 125.7: a 38-long arc */}
      <circle className="loader-outer" cx="24" cy="24" r="20" stroke="var(--coral)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="38 88" />
      <circle className="loader-inner" cx="24" cy="24" r="12" stroke="var(--ink-2)" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" strokeDasharray="22 54" />
      {size !== 'sm' && <circle className="loader-dot" cx="24" cy="24" r="3" fill="var(--coral)" />}
    </svg>
  )
}

/** True once `ms` have passed while `active`; resets when it stops. */
function useAfter(ms: number, active = true) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setDone(true), ms)
    return () => {
      clearTimeout(t)
      setDone(false)
    }
  }, [ms, active])
  return done
}

interface LoadingProps {
  label?: string
  /** Shown under the label when loading drags on, e.g. a big tenant. */
  slowHint?: ReactNode
  /** `block` centres in a roomy area (pages, panels, dialogs); `inline` is one compact row (list boxes). */
  variant?: 'block' | 'inline'
  className?: string
}

export function Loading({ label = 'Loading…', slowHint = 'Large tenants can take a little longer.', variant = 'block', className = '' }: LoadingProps) {
  const slow = useAfter(6000)

  if (variant === 'inline') {
    return (
      <div role="status" aria-live="polite" className={`loader-in flex items-center gap-2.5 px-3 py-3 text-sm text-ink-2 ${className}`}>
        <Spinner size="sm" />
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div role="status" aria-live="polite" className={`loader-in flex min-h-56 flex-col items-center justify-center gap-4 px-6 py-12 text-center ${className}`}>
      <Spinner size="lg" />
      <div>
        <p className="font-display text-base font-semibold text-ink">{label}</p>
        <p className={`mt-1 text-sm text-ink-3 transition-opacity duration-500 ${slow && slowHint ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!slow}>
          {slowHint || ' '}
        </p>
      </div>
    </div>
  )
}

/** Thin coral sweep pinned under the header while the next page's code or data loads. */
export function RouteProgress({ active }: { active: boolean }) {
  const show = useAfter(150, active)
  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-hidden={!show}
      className={`pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <span className="loader-sweep block h-full w-full origin-left rounded-full bg-coral" />
    </div>
  )
}

/** Before the shell can render (session check, first page chunk): the logo on the navy cover. */
export function ScreenLoader({ label }: { label: string }) {
  return (
    <div className="vinyl grid min-h-dvh place-items-center text-on-cover">
      <div role="status" className="loader-in flex flex-col items-center gap-5">
        <span className="relative grid size-20 place-items-center">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden className="absolute inset-0 size-full">
            <circle cx="24" cy="24" r="22" stroke="oklch(1 0 0 / 0.12)" strokeWidth="2" />
            <circle className="loader-outer" cx="24" cy="24" r="22" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeDasharray="34 105" />
          </svg>
          <img src="/logo.png" alt="" className="size-11" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </span>
        <span className="text-sm text-on-cover/75">{label}</span>
      </div>
    </div>
  )
}
