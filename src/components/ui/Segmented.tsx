import type { ReactNode } from 'react'

interface SegmentedProps<V extends string> {
  value: V
  onChange: (value: V) => void
  options: { value: V; label: ReactNode; icon?: ReactNode }[]
  label: string
  /** `tabs` fills the width (dialog tabs); `pill` sizes to content (toolbars). */
  variant?: 'tabs' | 'pill'
  className?: string
}

/** One choice out of a few, shown side by side. Used for tabs and modes. */
export function Segmented<V extends string>({ value, onChange, options, label, variant = 'pill', className = '' }: SegmentedProps<V>) {
  const tabs = variant === 'tabs'
  return (
    <div role="radiogroup" aria-label={label} className={`flex items-center rounded-full border border-line bg-paper-2 p-1 ${tabs ? 'w-full' : 'w-fit'} ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold text-ink-2 transition-colors hover:text-ink aria-checked:bg-ink aria-checked:text-paper aria-checked:shadow-[0_2px_8px_-2px_hsl(var(--shadow)/0.4)] ${
            tabs ? 'h-10 flex-1 px-4 text-sm' : 'h-8 px-3.5 text-sm'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}
