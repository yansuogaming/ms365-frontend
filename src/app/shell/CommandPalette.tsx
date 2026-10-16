import { clsx } from 'clsx'
import { CornerDownLeft, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { allNavItems } from '../navigation'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allNavItems
    return allNavItems.filter((i) => i.label.toLowerCase().includes(q) || i.group.label.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) {
      setQuery('')
      setActive(0)
      d.showModal()
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (index: number) => {
    const item = results[index]
    if (!item) return
    onClose()
    navigate(item.path)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(active)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-label="Go to page"
      className="m-auto mt-[12vh] w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper p-0 text-ink shadow-[0_24px_60px_-20px_hsl(var(--shadow)/0.6)] backdrop:bg-[oklch(0.2_0.04_262/0.55)]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-4 text-ink-3" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Go to a page…"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={results[active] ? `palette-${active}` : undefined}
          className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
        />
        <kbd className="rounded-md border border-line px-1.5 text-[11px] font-medium text-ink-3">Esc</kbd>
      </div>
      <ul id="palette-results" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
        {results.length === 0 && <li className="px-3 py-6 text-sm text-ink-2">No page matches “{query}”.</li>}
        {results.map((item, i) => (
          <li
            key={item.path}
            id={`palette-${i}`}
            data-index={i}
            role="option"
            aria-selected={i === active}
            onMouseMove={() => setActive(i)}
            onClick={() => go(i)}
            className={clsx(
              'flex h-10 cursor-pointer items-center gap-3 rounded-[var(--radius-paper)] px-3 text-sm',
              i === active ? 'bg-coral-wash text-ink' : 'text-ink-2',
            )}
          >
            <item.icon className="size-4 shrink-0 text-coral-ink" strokeWidth={1.75} aria-hidden />
            <span className="flex-1 truncate">{item.label}</span>
            <span className="text-xs font-semibold tracking-wide text-ink-3 uppercase">
              {item.group.label}
            </span>
            {i === active && <CornerDownLeft className="size-3.5 opacity-70" aria-hidden />}
          </li>
        ))}
      </ul>
    </dialog>
  )
}
