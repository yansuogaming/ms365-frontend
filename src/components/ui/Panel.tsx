import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** The work area's one container: square corners, 1px rule, no shadow. */
export function Panel({ title, actions, className, children }: PanelProps) {
  return (
    <section className={clsx('rounded-board border border-line bg-surface', className)}>
      {(title || actions) && (
        <header className="flex min-h-12 items-center justify-between gap-4 border-b border-line-soft px-5 py-2.5">
          {title && <h2 className="font-board text-[13px] font-bold tracking-[0.14em] uppercase">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
