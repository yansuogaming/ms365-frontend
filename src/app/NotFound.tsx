import { Link } from 'react-router'
import { EmptyState } from '@/components/ui/StateViews'
import { Panel } from '@/components/ui/Panel'

export function NotFound() {
  return (
    <Panel>
      <EmptyState
        title="Page not found"
        action={
          <Link to="/dashboard" className="text-sm font-semibold underline">
            Back to Dashboard
          </Link>
        }
      >
        The address doesn’t match any page. Use the menu or press Ctrl K to find one.
      </EmptyState>
    </Panel>
  )
}
