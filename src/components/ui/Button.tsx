import { clsx } from 'clsx'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ground hover:bg-ink/88 active:bg-ink/80',
  secondary: 'border border-line bg-surface text-ink hover:border-ink-faint hover:bg-surface-sunk',
  ghost: 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
  danger: 'border border-danger/40 text-danger hover:bg-danger-soft',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-[15px]',
}

export function Button({ variant = 'secondary', size = 'md', loading, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-board font-semibold whitespace-nowrap',
        'transition-[background-color,border-color,color] duration-150 ease-out',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
