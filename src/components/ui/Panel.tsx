import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** The work area's container: paper sheet with the shared soft shadow. */
export function Panel({ title, actions, className = '', children }: PanelProps) {
  return (
    <section className={`paper-shadow rounded-[var(--radius-paper)] border border-line bg-paper ${className}`}>
      {(title || actions) && (
        <header className="flex min-h-14 items-center justify-between gap-4 border-b border-line px-6 py-3">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
