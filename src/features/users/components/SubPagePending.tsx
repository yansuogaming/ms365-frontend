import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/ui/admin'
import { Panel } from '@/components/ui/Panel'
import { EmptyState } from '@/components/ui/StateViews'

/** Holds a Users sub-screen's place until its own folder is built. */
export function SubPagePending({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-6">
      <Link to="/identity/users" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-coral-ink">
        <ArrowLeft className="size-4" aria-hidden />
        All users
      </Link>
      <PageHeader title={title} description={description} />
      <Panel>
        <EmptyState title="This screen is next on the list">It will be built in this folder and wired to the API in docs/API_CONTRACT.md.</EmptyState>
      </Panel>
    </div>
  )
}
