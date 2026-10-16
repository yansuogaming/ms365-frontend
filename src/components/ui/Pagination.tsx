import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZES } from '@/lib/hooks/useListParams'
import { formatNumber } from './admin'
import { Select } from './Select'

interface PaginationProps {
  /** 1-based current page. */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizes?: readonly number[]
  /** Plural noun for the summary, e.g. "users". */
  itemLabel?: string
  /** Dims the controls while the next page loads. */
  busy?: boolean
  className?: string
}

/** Page numbers to show: always first and last, the current page with one neighbour each side, gaps as null. */
export function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const out: (number | null)[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null)
    out.push(p)
  })
  return out
}

const navButton =
  'inline-flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink disabled:pointer-events-none disabled:opacity-35'

/**
 * Shared pager for every list screen. Pair it with `useListParams` so the page
 * lives in the URL.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = PAGE_SIZES,
  itemLabel = 'items',
  busy = false,
  className = '',
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${busy ? 'opacity-70' : ''} ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
        <p aria-live="polite">
          {total === 0 ? (
            `No ${itemLabel}`
          ) : (
            <>
              <span className="tabular font-semibold text-ink">
                {formatNumber(from)}–{formatNumber(to)}
              </span>{' '}
              of <span className="tabular font-semibold text-ink">{formatNumber(total)}</span> {itemLabel}
            </>
          )}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span aria-hidden>Rows</span>
            <Select label="Rows per page" value={pageSize} onChange={onPageSizeChange} options={pageSizes.map((s) => ({ value: s, label: String(s) }))} />
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-1 sm:justify-start">
          <button type="button" className={navButton} onClick={() => onPageChange(current - 1)} disabled={current <= 1} aria-label="Previous page">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          {/* phones: "Page 3 of 12"; wider screens: numbered pages */}
          <span className="tabular px-2 text-sm text-ink-2 sm:hidden">
            Page <span className="font-semibold text-ink">{current}</span> of {pageCount}
          </span>
          {pageWindow(current, pageCount).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} aria-hidden className="hidden w-6 text-center text-ink-3 sm:inline">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === current ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={`tabular hidden h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm transition-colors sm:inline-flex ${
                  p === current ? 'bg-ink font-semibold text-paper' : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className={navButton} onClick={() => onPageChange(current + 1)} disabled={current >= pageCount} aria-label="Next page">
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </nav>
  )
}
