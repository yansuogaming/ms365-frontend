import { CircleAlert, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { ApiError } from '@/lib/api/client'
import { Button } from './Button'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 px-5 py-10 text-sm text-ink-muted">
      <LoaderCircle className="size-4 animate-spin text-brass" aria-hidden />
      {label}
    </div>
  )
}

/** Table/list skeleton: rows of bars sized like the content they replace. */
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-line-soft">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid gap-6 px-5 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, c) => (
            <span key={c} className="h-3 animate-pulse rounded-sm bg-surface-sunk" style={{ width: `${55 + ((r + c) % 3) * 15}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 px-5 py-10">
      <Inbox className="size-5 text-ink-faint" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">{children}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.'
  const status = error instanceof ApiError && error.status > 0 ? `Error ${error.status}` : null
  return (
    <div role="alert" className="flex flex-col items-start gap-3 px-5 py-10">
      <CircleAlert className="size-5 text-danger" aria-hidden />
      <div>
        <p className="font-semibold">Couldn’t load this data</p>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">
          {message}
          {status && <span className="ml-2 font-board tracking-wide text-ink-faint">{status}</span>}
        </p>
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  )
}
