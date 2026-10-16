import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SearchInputProps {
  /** The committed value (usually from the URL). */
  value: string
  /** Called once typing pauses for `delay` ms, with the trimmed text. */
  onSearch: (value: string) => void
  placeholder?: string
  label?: string
  delay?: number
  className?: string
}

/** Pill search box shared by every list screen. Debounced; has its own clear button. */
export function SearchInput({ value, onSearch, placeholder = 'Search…', label = 'Search', delay = 350, className = '' }: SearchInputProps) {
  const [text, setText] = useState(value)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // follow outside resets (e.g. "Clear filters") without fighting the user's typing
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value !== text.trim()) setText(value)
  }

  function change(next: string, immediate = false) {
    setText(next)
    window.clearTimeout(timer.current)
    if (immediate) onSearch(next.trim())
    else timer.current = window.setTimeout(() => onSearch(next.trim()), delay)
  }

  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && change(text, true)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-line bg-paper pr-9 pl-10 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 hover:border-ink-3 focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => change('', true)}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </label>
  )
}
