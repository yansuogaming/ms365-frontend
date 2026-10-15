import { clsx } from 'clsx'
import { useApiStatus } from '@/lib/api/health'

const copy = {
  checking: 'Checking API',
  online: 'API online',
  offline: 'API offline',
} as const

export function ApiStatusPill({ className }: { className?: string }) {
  const status = useApiStatus()
  return (
    <span
      role="status"
      className={clsx(
        'inline-flex h-9 items-center gap-2 rounded-board border border-line bg-surface px-3 text-[13px] text-ink-muted',
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          'size-2 rounded-full',
          status === 'online' && 'bg-ok',
          status === 'offline' && 'bg-danger',
          status === 'checking' && 'animate-pulse bg-ink-faint',
        )}
      />
      {copy[status]}
    </span>
  )
}
