import { useState } from 'react'
import { Link } from 'react-router'

/** Brand mark: the gear with an "A", served from public/logo.png. */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) {
    // Shown only until public/logo.png is added.
    return (
      <span aria-hidden className={`grid place-items-center rounded-lg bg-coral font-display font-bold text-on-coral ${className}`}>
        A
      </span>
    )
  }
  return <img src="/logo.png" alt="" aria-hidden className={`object-contain ${className}`} onError={() => setMissing(true)} />
}

export function Logo({ to = '/', tagline = true }: { to?: string; tagline?: boolean }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5 rounded-md" aria-label="M365 Admin, go to dashboard">
      <LogoMark className="size-9 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-45" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.1rem] font-semibold tracking-tight">M365 Admin</span>
        {tagline && <span className="mt-1 text-xs opacity-70">Tenant console</span>}
      </span>
    </Link>
  )
}
