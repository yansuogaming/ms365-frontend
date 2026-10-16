import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

interface TabsProps<V extends string> {
  value: V
  onChange: (value: V) => void
  tabs: { value: V; label: ReactNode }[]
  label: string
  className?: string
}

/**
 * Tab strip (WAI-ARIA tabs): ← → Home End move between tabs. Scrolls sideways
 * on narrow screens. Pair each panel with `tabPanelProps(id, value)`.
 */
export function Tabs<V extends string>({ value, onChange, tabs, label, className = '' }: TabsProps<V>) {
  const id = useId()
  const list = useRef<HTMLDivElement>(null)

  function onKeyDown(e: KeyboardEvent) {
    const i = tabs.findIndex((t) => t.value === value)
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null
    if (next === null) return
    e.preventDefault()
    const t = tabs[(next + tabs.length) % tabs.length]
    onChange(t.value)
    list.current?.querySelector<HTMLButtonElement>(`[data-tab="${t.value}"]`)?.focus()
  }

  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {tabs.map((t) => {
        const on = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            data-tab={t.value}
            id={`${id}-${t.value}`}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={`relative h-11 shrink-0 px-3.5 text-sm font-semibold whitespace-nowrap transition-colors after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full ${
              on ? 'text-ink after:bg-coral' : 'text-ink-3 hover:text-ink after:bg-transparent'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
