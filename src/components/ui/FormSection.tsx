import type { ReactNode } from 'react'

const dots = { coral: 'bg-coral', ok: 'bg-ok', warn: 'bg-warn', ink: 'bg-ink-3', danger: 'bg-danger' } as const

/** A titled group of fields inside a dialog or form ("Identity", "Password", …). */
export function FormSection({
  title,
  aside,
  tone = 'coral',
  optional = false,
  children,
}: {
  title: string
  aside?: ReactNode
  tone?: keyof typeof dots
  optional?: boolean
  children: ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-paper)] border border-line bg-paper p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-sans text-xs font-semibold tracking-wide text-ink-2 uppercase">
          <span aria-hidden className={`size-1.5 rounded-full ${dots[tone]}`} />
          {title}
          {optional && <span className="font-normal tracking-normal text-ink-3 normal-case">(optional)</span>}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}
