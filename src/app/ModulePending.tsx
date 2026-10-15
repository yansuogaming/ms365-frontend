import { useLocation } from 'react-router'
import { EmptyState } from '@/components/ui/StateViews'
import { Panel } from '@/components/ui/Panel'
import { findNavItem } from './navigation'

/** Route target for modules whose folder under src/features has not been built yet. */
export function ModulePending() {
  const item = findNavItem(useLocation().pathname)
  return (
    <Panel title={item?.label ?? 'Page'}>
      <EmptyState title="This module isn’t built yet">
        The screen for {item?.label ?? 'this page'} will live in its own folder under src/features. Nothing here calls the API yet.
      </EmptyState>
    </Panel>
  )
}
