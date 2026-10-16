import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatDateTime, Tag } from '@/components/ui/admin'
import { Panel } from '@/components/ui/Panel'
import { EmptyState, ErrorState } from '@/components/ui/StateViews'
import { useRecentUsers } from '../api'
import type { UserStatus } from '../types'
import { Loading } from '@/components/ui/Loader'

const status: Record<UserStatus, { label: string; tone: 'ok' | 'danger' | 'warn' }> = {
  active: { label: 'Active', tone: 'ok' },
  blocked: { label: 'Blocked', tone: 'danger' },
  pending: { label: 'Pending', tone: 'warn' },
}

export function RecentUsers() {
  const { data, isPending, isError, error, refetch } = useRecentUsers()

  return (
    <Panel
      title="Recent users"
      actions={
        <Link to="/identity/users" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-coral-ink">
          View all
          <ArrowRight className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5" aria-hidden />
        </Link>
      }
    >
      {isPending ? (
        <Loading label="Loading recent users…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title="No users yet">New accounts created in this tenant will show up here.</EmptyState>
      ) : (
        <>
        {/* phones: a compact list */}
        <ul className="divide-y divide-line sm:hidden">
          {data.map((u) => (
            <li key={u.id} className="flex items-start gap-3 px-4 py-3">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-3 text-xs text-ink-2">
                {u.displayName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate font-semibold">{u.displayName}</p>
                  <Tag tone={status[u.status].tone}>{status[u.status].label}</Tag>
                </div>
                <p className="truncate text-sm text-ink-2">{u.upn}</p>
                <time dateTime={u.createdAt} className="tabular text-xs text-ink-3">
                  {formatDateTime(u.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold tracking-wide text-ink-3 uppercase">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="hidden px-3 py-3 font-semibold lg:table-cell">Email</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-paper-2">
                  <td className="px-6 py-3.5">
                    <span className="flex items-center gap-3 font-semibold">
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-3 text-xs text-ink-2">
                        {u.displayName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate">{u.displayName}</span>
                        <span className="block truncate text-xs font-normal text-ink-3 lg:hidden">{u.upn}</span>
                      </span>
                    </span>
                  </td>
                  <td className="hidden max-w-[18rem] truncate px-3 py-3.5 text-ink-2 lg:table-cell">{u.upn}</td>
                  <td className="px-3 py-3.5">
                    <Tag tone={status[u.status].tone}>{status[u.status].label}</Tag>
                  </td>
                  <td className="tabular px-6 py-3.5 text-right whitespace-nowrap text-ink-2">
                    <time dateTime={u.createdAt}>{formatDateTime(u.createdAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </Panel>
  )
}
