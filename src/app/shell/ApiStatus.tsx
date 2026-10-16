import { useApiStatus } from '@/lib/api/health'

const copy = { checking: 'Checking API', online: 'API online', offline: 'API offline' } as const
const dot = { checking: 'animate-pulse bg-ink-3', online: 'bg-ok', offline: 'bg-danger' } as const

/** `className` sets the display (default inline-flex), e.g. "hidden md:inline-flex". */
export function ApiStatus({ className = 'inline-flex' }: { className?: string }) {
  const status = useApiStatus()
  return (
    <span role="status" className={`h-9 items-center gap-2 rounded-full border border-line bg-paper px-3.5 text-sm text-ink-2 ${className}`}>
      <span aria-hidden className={`size-2 rounded-full ${dot[status]}`} />
      {copy[status]}
    </span>
  )
}
