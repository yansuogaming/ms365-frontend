import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { ProductListQuery, ProductRow } from './types'

function listPath(q: ProductListQuery) {
  const p = new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize) })
  if (q.search) p.set('search', q.search)
  if (q.status) p.set('status', q.status)
  return `/billing/products?${p}`
}

export const productsApi = {
  list: (q: ProductListQuery) => apiFetch<Page<ProductRow>>(listPath(q)),
}

export const useProducts = (q: ProductListQuery) =>
  useQuery({ queryKey: ['products', q], queryFn: () => productsApi.list(q), placeholderData: keepPreviousData })
