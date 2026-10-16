import { Check, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { usePopover } from './usePopover'

export interface SelectOption<V extends string | number = string> {
  value: V
  label: string
  /** Muted text on the right, e.g. a count or a code. */
  hint?: string
  /** Section heading shown above the first option of each group, e.g. "By license". */
  group?: string
}

type Variant = 'pill' | 'field' | 'header'

/**
 * Trigger look shared by every dropdown (Select, the Tools menu, More…), so they
 * all read as one family. `pill` sits in toolbars, `field` matches text inputs,
 * `header` is a table column title that filters its column.
 */
export function dropdownTriggerClass(variant: Variant = 'pill', extra = '') {
  if (variant === 'header')
    return `group inline-flex items-center gap-1.5 rounded text-xs font-semibold tracking-wide uppercase text-ink-3 outline-none transition-colors hover:text-ink aria-expanded:text-ink focus-visible:text-ink focus-visible:underline ${extra}`
  const base =
    'group inline-flex items-center gap-2 border border-line bg-paper text-ink transition-[border-color,box-shadow] outline-none hover:border-ink-3 focus-visible:border-coral focus-visible:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] aria-expanded:border-ink-3 disabled:pointer-events-none disabled:opacity-50'
  const look = variant === 'pill' ? 'h-10 rounded-full pr-3 pl-4 text-sm font-semibold' : 'h-12 w-full rounded-[var(--radius-paper)] pr-3 pl-4 text-base'
  return `${base} ${look} ${extra}`
}

/** The chevron every dropdown trigger ends with; turns while open. */
export function DropdownChevron({ open }: { open: boolean }) {
  return <ChevronDown className={`size-4 shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden />
}

interface SelectProps<V extends string | number> {
  value: V
  onChange: (value: V) => void
  options: SelectOption<V>[]
  /** Accessible name (also used as visible label when `label` is shown). */
  label: string
  /** Render the label above the trigger (forms). Toolbars keep it screen-reader only. */
  showLabel?: boolean
  variant?: Variant
  /** Leading icon inside the trigger. */
  icon?: ReactNode
  /** Trigger text instead of the selected option's label (column headers show the column name). */
  display?: ReactNode
  /** Marks the trigger as an active filter (coral dot). */
  filtered?: boolean
  disabled?: boolean
  className?: string
}


/**
 * Custom select used everywhere instead of the native <select>, so the closed
 * trigger and the open list match the app in light and dark themes.
 * Keyboard: ↑ ↓ Home End to move, Enter or Space to pick, Esc to close, letters to jump.
 */
export function Select<V extends string | number>({
  value,
  onChange,
  options,
  label,
  showLabel = false,
  variant = 'pill',
  icon,
  display,
  filtered = false,
  disabled,
  className = '',
}: SelectProps<V>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const close = useCallback(() => setOpen(false), [])
  // shared with MultiSelect: fixed position, flips up near the bottom, closes on outside click
  const { trigger, panel: list, style, ready } = usePopover(open, close)
  const id = useId()
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, list])

  function openList() {
    setActive(selectedIndex)
    setOpen(true)
  }

  function pick(i: number) {
    const o = options[i]
    if (o) onChange(o.value)
    setOpen(false)
    trigger.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    const last = options.length - 1
    if (e.key === 'ArrowDown') setActive((a) => Math.min(last, a + 1))
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' || e.key === ' ') pick(active)
    else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
      if (e.key === 'Tab') return
    } else if (e.key.length === 1) {
      // type-ahead: jump to the next option starting with that letter
      const k = e.key.toLowerCase()
      const from = (active + 1) % options.length
      const order = [...options.keys()].map((i) => (from + i) % options.length)
      const hit = order.find((i) => options[i].label.toLowerCase().startsWith(k))
      if (hit !== undefined) setActive(hit)
      return
    } else return
    e.preventDefault()
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {showLabel && (
        <span id={`${id}-label`} className="text-sm font-semibold text-ink">
          {label}
        </span>
      )}
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? `${id}-label` : undefined}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={dropdownTriggerClass(variant, variant === 'header' ? (filtered ? 'text-coral-ink' : '') : 'max-w-full justify-between')}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate">{display ?? selected?.label ?? 'Select…'}</span>
          {filtered && <span className="size-1.5 shrink-0 rounded-full bg-coral" aria-label="(filtered)" />}
        </span>
        <DropdownChevron open={open} />
      </button>

      {open && ready && (
        <ul
          ref={list as RefObject<HTMLUListElement>}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          style={style}
          className="paper-shadow fixed z-[70] max-w-[min(24rem,calc(100vw-16px))] overflow-y-auto rounded-[var(--radius-paper)] border border-line bg-paper p-1"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value
            const heading = o.group && o.group !== options[i - 1]?.group ? o.group : null
            return [
              heading && (
                <li key={`group-${heading}`} role="presentation" className="mt-1 border-t border-line px-3 pt-2.5 pb-1 text-[11px] font-semibold tracking-wide text-ink-3 uppercase first:mt-0 first:border-t-0">
                  {heading}
                </li>
              ),
              <li
                key={String(o.value)}
                id={`${id}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActive(i)}
                onClick={() => pick(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm ${i === active ? 'bg-paper-2 text-ink' : 'text-ink-2'} ${
                  isSelected ? 'font-semibold text-ink' : ''
                }`}
              >
                <Check className={`size-4 shrink-0 text-coral-ink ${isSelected ? '' : 'invisible'}`} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="tabular shrink-0 text-xs text-ink-3">{o.hint}</span>}
              </li>,
            ]
          })}
        </ul>
      )}
    </div>
  )
}
