import { CircleHelp } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'

/**
 * A "?" that explains something on hover, keyboard focus or tap.
 * Fixed-positioned so it is never clipped by scrolling dialogs or tables.
 */
export function InfoTip({ children, label = 'More information', className = '' }: { children: ReactNode; label?: string; className?: string }) {
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null)
  const ref = useRef<HTMLButtonElement>(null)
  const id = useId()

  function show() {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const width = Math.min(320, window.innerWidth - 16)
    const above = window.innerHeight - r.bottom < 180
    setPos({ left: Math.max(8, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 8)), top: above ? r.top - 8 : r.bottom + 8, above })
  }
  const hide = () => setPos(null)

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-describedby={pos ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        // only keyboard focus (Tab) opens it, not the focus a dialog places on open
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && show()}
        onBlur={hide}
        onClick={(e) => {
          e.stopPropagation()
          if (pos) hide()
          else show()
        }}
        className={`inline-grid size-5 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink focus-visible:text-ink ${className}`}
      >
        <CircleHelp className="size-4" aria-hidden />
      </button>
      {pos && (
        <span
          id={id}
          role="tooltip"
          style={{ left: pos.left, top: pos.top, width: Math.min(320, window.innerWidth - 16) }}
          className={`pointer-events-none fixed z-[80] rounded-[var(--radius-paper)] bg-ink px-3.5 py-3 text-left text-sm leading-relaxed font-normal text-paper shadow-[0_12px_32px_-12px_hsl(var(--shadow)/0.6)] ${pos.above ? '-translate-y-full' : ''}`}
        >
          {children}
        </span>
      )}
    </>
  )
}
