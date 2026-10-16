import { CircleAlert, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { ApiError } from '@/lib/api/client'
import { Button } from './Button'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 px-6 py-10 text-sm text-ink-2">
      <LoaderCircle className="size-4 animate-spin text-coral" aria-hidden />
      {label}
    </div>
  )
}

/** Table/list skeleton: rows of bars sized like the content they replace. */
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid gap-6 px-6 py-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, c) => (
            <span key={c} className="h-3 animate-pulse rounded-full bg-paper-3" style={{ width: `${55 + ((r + c) % 3) * 15}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 px-6 py-10">
      <span className="grid size-11 place-items-center rounded-full bg-paper-2 text-ink-3">
        <Inbox className="size-5" aria-hidden />
      </span>
      <div>
        <p className="font-display text-lg font-semibold">{title}</p>
        {children && <p className="mt-1 max-w-[60ch] text-ink-2 [overflow-wrap:anywhere]">{children}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.'
  const status = error instanceof ApiError && error.status > 0 ? `Error ${error.status}` : null
  return (
    <div role="alert" className="flex flex-col items-start gap-3 px-6 py-10">
      <span className="grid size-11 place-items-center rounded-full bg-danger-wash text-danger">
        <CircleAlert className="size-5" aria-hidden />
      </span>
      <div>
        <p className="font-display text-lg font-semibold">Couldn’t load this data</p>
        <p className="mt-1 max-w-[60ch] text-ink-2 [overflow-wrap:anywhere]">
          {message}
          {status && <span className="ml-2 text-sm text-ink-3">{status}</span>}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  )
}
