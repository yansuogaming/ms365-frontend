import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePref } from '@/lib/theme'

const options: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeToggle() {
  const { pref, setPref } = useTheme()
  return (
    <div role="radiogroup" aria-label="Theme" className="flex h-9 items-center rounded-board border border-line bg-surface p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          title={label}
          onClick={() => setPref(value)}
          className="grid size-7.5 place-items-center rounded-[3px] text-ink-faint transition-colors hover:text-ink aria-checked:bg-ink aria-checked:text-ground"
        >
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}
