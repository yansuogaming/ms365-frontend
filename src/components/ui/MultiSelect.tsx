import { Check, Search } from 'lucide-react'
import { useCallback, useId, useState, type KeyboardEvent, type RefObject } from 'react'
import { DropdownChevron, dropdownTriggerClass } from './Select'
import { usePopover } from './usePopover'

export interface MultiOption {
  value: string
  label: string
  hint?: string
  disabled?: boolean
}

interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: MultiOption[]
  label: string
  showLabel?: boolean
  optional?: boolean
  placeholder?: string
  /** Shown inside the list when there is nothing to pick. */
  emptyText?: string
  loading?: boolean
  className?: string
  /** Search box text; the search also matches option values (e.g. an id). */
  searchPlaceholder?: string
}

/**
 * Pick several values. Same trigger and list styling as <Select>, with a
 * search box once the list is long. Space/Enter toggles, Esc closes.
 */
export function MultiSelect({
  value,
  onChange,
  options,
  label,
  showLabel = true,
  optional = false,
  placeholder = 'Select…',
  emptyText = 'Nothing to choose from.',
  loading = false,
  className = '',
  searchPlaceholder = 'Filter…',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const close = useCallback(() => setOpen(false), [])
  const { trigger, panel, style, ready } = usePopover(open, close)
  const id = useId()

  const picked = new Set(value)
  const q = query.trim().toLowerCase()
  const visible = options.filter((o) => !q || o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  const selectedLabels = options.filter((o) => picked.has(o.value)).map((o) => o.label)

  function toggle(v: string) {
    const n = new Set(picked)
    if (n.has(v)) n.delete(v)
    else n.add(v)
    onChange(options.map((o) => o.value).filter((x) => n.has(x)))
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') setActive((a) => Math.min(visible.length - 1, a + 1))
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1))
    else if (e.key === 'Enter' || (e.key === ' ' && e.target === trigger.current)) {
      const o = visible[active]
      if (o && !o.disabled) toggle(o.value)
    } else if (e.key === 'Escape') {
      setOpen(false)
      trigger.current?.focus()
    } else return
    e.preventDefault()
  }

  const summary = selectedLabels.length === 0 ? null : selectedLabels.length <= 2 ? selectedLabels.join(', ') : `${selectedLabels.length} selected`

  return (
    <div className={`flex flex-col gap-2 ${className}`} onKeyDown={onKeyDown}>
      {showLabel && (
        <span id={`${id}-label`} className="text-sm font-semibold text-ink">
          {label}
          {optional && <span className="ml-1 font-normal text-ink-3">(optional)</span>}
        </span>
      )}
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? `${id}-label` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={dropdownTriggerClass('field', 'justify-between')}
      >
        <span className={`truncate ${summary ? '' : 'text-ink-3'}`}>{summary ?? placeholder}</span>
        <DropdownChevron open={open} />
      </button>

      {open && ready && (
        <div
          ref={panel as RefObject<HTMLDivElement>}
          style={style}
          className="paper-shadow fixed z-[70] flex max-w-[min(26rem,calc(100vw-16px))] flex-col overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper"
        >
          {options.length > 8 && (
            <label className="relative border-b border-line p-1.5">
              <span className="sr-only">Filter {label}</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-md bg-paper-2 pr-3 pl-8 text-sm outline-none"
              />
            </label>
          )}
          <ul id={`${id}-list`} role="listbox" aria-multiselectable="true" aria-label={label} className="min-h-0 flex-1 overflow-y-auto p-1">
            {loading ? (
              <li className="px-3 py-2 text-sm text-ink-3">Loading…</li>
            ) : visible.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ink-3">{options.length ? `No match for “${query}”.` : emptyText}</li>
            ) : (
              visible.map((o, i) => {
                const on = picked.has(o.value)
                return (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={on}
                    aria-disabled={o.disabled}
                    onPointerMove={() => setActive(i)}
                    onClick={() => !o.disabled && toggle(o.value)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm aria-disabled:cursor-not-allowed aria-disabled:opacity-45 ${i === active ? 'bg-paper-2 text-ink' : 'text-ink-2'}`}
                  >
                    <span className={`grid size-4 shrink-0 place-items-center rounded border ${on ? 'border-coral bg-coral text-on-coral' : 'border-ink-3/60'}`}>
                      {on && <Check className="size-3" strokeWidth={3} aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.hint && <span className="tabular shrink-0 text-xs text-ink-3">{o.hint}</span>}
                  </li>
                )
              })
            )}
          </ul>
          {value.length > 0 && (
            <div className="flex items-center justify-between border-t border-line px-3 py-2 text-xs">
              <span className="text-ink-3">{value.length} selected</span>
              <button type="button" onClick={() => onChange([])} className="font-semibold text-coral-ink hover:underline">
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
