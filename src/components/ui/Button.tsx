import { LoaderCircle } from 'lucide-react'
import type { ComponentProps } from 'react'

// Ported from Family Photos: pill buttons, coral primary.
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform,border-color] duration-200 ease-[var(--ease-out-expo)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-coral text-on-coral hover:bg-coral-strong shadow-[0_1px_0_oklch(1_0_0/0.25)_inset,0_6px_16px_-8px_var(--coral)]',
  secondary: 'border border-line bg-paper text-ink hover:border-ink-3 hover:bg-paper-2',
  ghost: 'text-ink-2 hover:text-ink hover:bg-paper-2',
  danger: 'border border-danger/40 text-danger hover:bg-danger-wash',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-13 px-7 text-base',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function IconButton({ label, className = '', ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink ${className}`}
      {...props}
    />
  )
}
