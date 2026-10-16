import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

export const PAGE_SIZES = [10, 25, 50, 100] as const

type Defaults = Record<string, string>

/**
 * List state (page, page size, search, filters, sort) kept in the URL, so a
 * reload, the back button or a shared link restores the same view.
 *
 *   const list = useListParams({ status: 'all', sort: 'createdAt:desc' })
 *   list.page, list.pageSize, list.get('status'), list.set({ status: 'blocked' })
 *
 * Changing anything other than the page sends the list back to page 1.
 */
export function useListParams<D extends Defaults>(defaults: D, defaultPageSize = 25) {
  const [params, setParams] = useSearchParams()

  const page = Math.max(1, Number(params.get('page')) || 1)
  const sizeParam = Number(params.get('size'))
  const pageSize = (PAGE_SIZES as readonly number[]).includes(sizeParam) ? sizeParam : defaultPageSize

  const get = useCallback((key: keyof D & string) => params.get(key) ?? defaults[key], [params, defaults])

  const set = useCallback(
    (changes: Partial<Record<keyof D | 'page' | 'size', string | number | null>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(changes)) {
            const isDefault = v === null || v === '' || String(v) === (defaults as Defaults)[k] || (k === 'page' && Number(v) === 1)
            if (isDefault) next.delete(k)
            else next.set(k, String(v))
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams, defaults],
  )

  const values = useMemo(() => {
    const out = {} as Record<keyof D, string>
    for (const k of Object.keys(defaults) as (keyof D & string)[]) out[k] = get(k)
    return out
  }, [defaults, get])

  return {
    page,
    pageSize,
    values,
    get,
    set,
    setPage: (p: number) => set({ page: p } as never),
    setPageSize: (s: number) => set({ size: s } as never),
  }
}
