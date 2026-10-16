import { formatDate, formatNumber, PageHeader, Tag } from '@/components/ui/admin'
import { Loading } from '@/components/ui/Loader'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select, type SelectOption } from '@/components/ui/Select'
import { EmptyState, ErrorState } from '@/components/ui/StateViews'
import { useListParams } from '@/lib/hooks/useListParams'
import { useProducts } from './api'
import type { ProductListQuery, ProductRow, ProductStatus } from './types'

const DEFAULTS = { search: '', status: '' }

const statusOptions: SelectOption<ProductListQuery['status']>[] = [
  { value: '', label: 'Any status' },
  { value: 'Active', label: 'Active' },
  { value: 'Warning', label: 'Warning', hint: 'Grace period' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Disabled', label: 'Disabled' },
  { value: 'Expired', label: 'Expired' },
]

const tone: Record<ProductStatus, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  Active: 'ok',
  Warning: 'warn',
  Suspended: 'danger',
  Disabled: 'neutral',
  Expired: 'danger',
}

const dash = <span className="text-ink-3">Not available</span>
const date = (d: string | null) => (d ? <time dateTime={d}>{formatDate(d)}</time> : dash)

/** Available seats with a thin bar of how much is used; amber from 90 %, red when none are left. */
function Seats({ p }: { p: ProductRow }) {
  const available = Math.max(0, p.purchased - p.assigned)
  const pct = p.purchased > 0 ? Math.min(100, (p.assigned / p.purchased) * 100) : 0
  return (
    <div className="ml-auto w-full max-w-28">
      <p className={`tabular text-right ${available === 0 ? 'font-semibold text-danger' : 'text-ink-2'}`}>{formatNumber(available)}</p>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-3"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={`${p.name}: ${Math.round(pct)}% of licenses assigned`}
      >
        <span className={`block h-full rounded-full ${pct >= 100 ? 'bg-danger' : pct >= 90 ? 'bg-warn' : 'bg-ink-3/60'}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  )
}

/** Read-only list of the tenant's licensed products. Buying and renewing stay in the Microsoft 365 admin center. */
export function ProductsPage() {
  const list = useListParams(DEFAULTS)
  const query: ProductListQuery = {
    page: list.page,
    pageSize: list.pageSize,
    search: list.values.search,
    status: list.values.status as ProductListQuery['status'],
  }
  const products = useProducts(query)
  const rows = products.data?.items ?? []
  const total = products.data?.total ?? 0
  const filtered = Boolean(query.search || query.status)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Product"
        description={
          products.data ? (
            <>
              <span className="tabular font-semibold text-ink">{formatNumber(total)}</span> license {total === 1 ? 'SKU' : 'SKUs'}
              {filtered ? ' match the current view.' : ' in this tenant.'} Purchases and renewals are managed in the Microsoft 365 admin center.
            </>
          ) : (
            'Licensed products in this tenant.'
          )
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
          <SearchInput value={query.search} onSearch={(search) => list.set({ search })} label="Search products" placeholder="Search product name…" className="w-full sm:max-w-80" />
          <Select label="Status" value={query.status} onChange={(status) => list.set({ status })} options={statusOptions} filtered={query.status !== ''} />
          {filtered && (
            <button type="button" onClick={() => list.set({ search: '', status: '' })} className="text-sm font-semibold text-coral-ink hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {products.isPending ? (
          <Loading label="Loading products…" />
        ) : products.isError && !products.data ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title={filtered ? 'No products match' : 'No licensed products'}>
            {filtered ? 'Change the search or the status filter.' : 'This tenant has no license subscriptions yet.'}
          </EmptyState>
        ) : (
          <div className={`transition-opacity ${products.isPlaceholderData ? 'opacity-60' : ''}`} aria-busy={products.isPlaceholderData}>
            {/* phones: one card per product */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((p) => (
                <li key={p.skuId} className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 font-semibold">{p.name}</p>
                    <Tag tone={tone[p.status]}>{p.status}</Tag>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    {(
                      [
                        ['Assigned', p.assigned],
                        ['Purchased', p.purchased],
                        ['Available', Math.max(0, p.purchased - p.assigned)],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-ink-3">{k}</dt>
                        <dd className="tabular font-semibold">{formatNumber(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div>
                      <dt className="text-ink-3">Renewal / expiration</dt>
                      <dd className="text-ink-2">{date(p.renewalDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-3">Purchase date</dt>
                      <dd className="text-ink-2">{date(p.purchaseDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-3">Channel · type</dt>
                      <dd className="text-ink-2">{[p.purchaseChannel, p.productType].filter(Boolean).join(' · ') || dash}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-3">Pricing · payment</dt>
                      <dd className="text-ink-2">{[p.pricingModel, p.payment].filter(Boolean).join(' · ') || dash}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            {/* tablet and up: lower-priority columns appear as the table gets room */}
            <div className="@container hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] table-fixed text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-semibold tracking-wide text-ink-3 uppercase">
                    <th scope="col" className="py-3 pr-3 pl-6">Product</th>
                    <th scope="col" className="w-28 px-3 py-3 text-right">Assigned</th>
                    <th scope="col" className="w-28 px-3 py-3 text-right">Purchased</th>
                    <th scope="col" className="w-32 px-3 py-3 text-right">Available</th>
                    <th scope="col" className="w-32 px-3 py-3 pl-6">Status</th>
                    <th scope="col" className="hidden w-36 px-3 py-3 @min-[1080px]:table-cell">Purchase date</th>
                    <th scope="col" className="hidden w-40 px-3 py-3 @min-[760px]:table-cell">Renewal / expiration</th>
                    <th scope="col" className="hidden w-44 px-3 py-3 @min-[1240px]:table-cell">Channel</th>
                    <th scope="col" className="hidden w-44 py-3 pr-6 pl-3 @min-[1400px]:table-cell">Pricing</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.skuId} className="border-b border-line transition-colors last:border-b-0 hover:bg-paper-2">
                      <td className="py-3.5 pr-3 pl-6">
                        <span className="block truncate font-semibold" title={p.name}>
                          {p.name}
                        </span>
                        {/* channel and pricing, while their own columns are hidden */}
                        <span className="block truncate text-xs text-ink-3 @min-[1400px]:hidden">
                          {[p.purchaseChannel, p.pricingModel, p.payment && `Payment: ${p.payment}`].filter(Boolean).join(' · ')}
                        </span>
                      </td>
                      <td className="tabular px-3 py-3.5 text-right text-ink-2">{formatNumber(p.assigned)}</td>
                      <td className="tabular px-3 py-3.5 text-right text-ink-2">{formatNumber(p.purchased)}</td>
                      <td className="px-3 py-3.5">
                        <Seats p={p} />
                      </td>
                      <td className="px-3 py-3.5 pl-6">
                        <Tag tone={tone[p.status]}>{p.status}</Tag>
                      </td>
                      <td className="hidden px-3 py-3.5 text-ink-2 @min-[1080px]:table-cell">{date(p.purchaseDate)}</td>
                      <td className="hidden px-3 py-3.5 text-ink-2 @min-[760px]:table-cell">{date(p.renewalDate)}</td>
                      <td className="hidden px-3 py-3.5 @min-[1240px]:table-cell">
                        <span className="block truncate text-ink-2">{p.purchaseChannel ?? dash}</span>
                        {p.productType && <span className="block truncate text-xs text-ink-3">{p.productType}</span>}
                      </td>
                      <td className="hidden py-3.5 pr-6 pl-3 @min-[1400px]:table-cell">
                        <span className="block truncate text-ink-2">{p.pricingModel ?? dash}</span>
                        {p.payment && <span className="block truncate text-xs text-ink-3">Payment: {p.payment}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {products.data && total > 0 && (
          <div className="border-t border-line px-4 py-4 sm:px-6">
            <Pagination
              page={list.page}
              pageSize={list.pageSize}
              total={total}
              onPageChange={(p) => {
                list.setPage(p)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onPageSizeChange={list.setPageSize}
              itemLabel="products"
              busy={products.isFetching}
            />
          </div>
        )}
      </Panel>
    </div>
  )
}
