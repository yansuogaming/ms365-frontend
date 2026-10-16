import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/admin'
import { ErrorState } from '@/components/ui/StateViews'
import { useSession } from '@/features/auth/useSession'
import { useRefreshDashboard, useSummary } from './api'
import { DirectorySync } from './components/DirectorySync'
import { ProtectedAdmin } from './components/ProtectedAdmin'
import { RecentUsers } from './components/RecentUsers'
import { StatCards } from './components/StatCards'

export function DashboardPage() {
  const session = useSession().data
  const summary = useSummary()
  const refresh = useRefreshDashboard()
  const [refreshing, setRefreshing] = useState(false)

  // The session already knows the tenant, so the header never waits on the summary.
  const tenant = summary.data?.tenant ?? session?.tenant

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={tenant?.displayName || tenant?.domain || 'Dashboard'}
        description={
          tenant && (
            <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>{tenant.domain}</span>
              <span className="text-ink-3">
                Tenant ID <span className="tabular text-ink-2 select-all">{tenant.id}</span>
              </span>
            </span>
          )
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            onClick={async () => {
              setRefreshing(true)
              await refresh()
              setRefreshing(false)
            }}
          >
            {!refreshing && <RefreshCw className="size-4" aria-hidden />}
            Refresh
          </Button>
        }
      />

      {summary.isError ? (
        <div className="paper-shadow rounded-[var(--radius-paper)] border border-line bg-paper">
          <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
        </div>
      ) : (
        <StatCards summary={summary.data} />
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <RecentUsers />
        <div className="flex flex-col gap-6">
          <DirectorySync />
          <ProtectedAdmin />
        </div>
      </div>
    </div>
  )
}
