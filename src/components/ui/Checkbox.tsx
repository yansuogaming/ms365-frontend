import { useEffect, useRef, type ReactNode } from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Some but not all rows selected (header checkbox). */
  indeterminate?: boolean
  label?: ReactNode
  /** Accessible name when there is no visible label. */
  'aria-label'?: string
  className?: string
}

export function Checkbox({ checked, onChange, indeterminate = false, label, className = '', ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  const box = (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={rest['aria-label']}
      className="size-4 shrink-0 cursor-pointer accent-[var(--coral)]"
    />
  )
  if (!label) return <span className={`inline-flex ${className}`}>{box}</span>
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 text-sm text-ink ${className}`}>
      {box}
      {label}
    </label>
  )
}
