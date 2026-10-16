import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
}

/** Small dropdown menu: opens below its trigger, closes on outside click, Esc or selection. */
export function Menu({ trigger, items, align = 'end' }: { trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode; items: MenuItem[]; align?: 'start' | 'end' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      {open && (
        <ul
          id={id}
          role="menu"
          className={`paper-shadow absolute top-[calc(100%+6px)] z-40 min-w-52 rounded-[var(--radius-paper)] border border-line bg-paper p-1 ${align === 'end' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors disabled:pointer-events-none disabled:opacity-45 ${
                  item.danger ? 'text-danger hover:bg-danger-wash' : 'text-ink hover:bg-paper-2'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
