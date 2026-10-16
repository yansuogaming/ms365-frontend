import { Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, formatNumber, PageHeader } from '@/components/ui/admin'
import { who } from '@/components/ui/FormDialog'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState } from '@/components/ui/StateViews'
import { notify } from '@/components/ui/Toaster'
import { useListParams } from '@/lib/hooks/useListParams'
import { groupsApi, useGroupList, useGroupMutation } from './api'
import { GroupsTable, kindOptions } from './components/GroupsTable'
import { CreateGroupDialog } from './dialogs/CreateGroupDialog'
import { ManageGroupDialog } from './dialogs/ManageGroupDialog'
import type { GroupListQuery, GroupRow, GroupSort } from './types'
import { Loading } from '@/components/ui/Loader'

const DEFAULTS = { search: '', kind: '', sort: 'displayName:asc' }

export function GroupsPage() {
  const reduce = useReducedMotion()
  const list = useListParams(DEFAULTS)
  const query: GroupListQuery = {
    page: list.page,
    pageSize: list.pageSize,
    search: list.values.search,
    kind: list.values.kind as GroupListQuery['kind'],
    sort: list.values.sort as GroupSort,
  }
  const groups = useGroupList(query)
  const rows = groups.data?.items ?? []
  const total = groups.data?.total ?? 0

  const [selected, setSelected] = useState<Map<string, GroupRow>>(new Map())
  const [manage, setManage] = useState<GroupRow | null>(null)
  const [creating, setCreating] = useState(false)
  // groups to delete: one from a row button, or the selection
  const [toDelete, setToDelete] = useState<GroupRow[] | null>(null)

  function toggle(row: GroupRow, checked: boolean) {
    setSelected((s) => {
      const n = new Map(s)
      if (checked) n.set(row.id, row)
      else n.delete(row.id)
      return n
    })
  }
  function togglePage(selectPage: boolean) {
    if (!selectPage) return setSelected(new Map())
    setSelected((s) => {
      const n = new Map(s)
      rows.forEach((r) => n.set(r.id, r))
      return n
    })
  }

  const remove = useGroupMutation(
    (ids: string[]) => groupsApi.remove(ids),
    (r, ids) => {
      const label = `Deleted ${r.succeeded} group${r.succeeded === 1 ? '' : 's'}`
      const description = r.failed.length ? r.failed.slice(0, 3).map((f) => `${f.label}: ${f.error}`).join(' · ') : undefined
      if (r.failed.length === 0) notify.success(label)
      else if (r.succeeded > 0) notify.warning(`${label}, ${r.failed.length} failed`, { description })
      else notify.error('No group was deleted', { description })
      // keep only the ones that failed selected, so they can be retried
      const failed = new Set(r.failed.map((f) => f.id))
      setSelected((s) => new Map([...s].filter(([id]) => !ids.includes(id) || failed.has(id))))
    },
  )

  const filtered = Boolean(query.search || query.kind)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Groups"
        description={
          groups.data ? (
            <>
              <span className="tabular font-semibold text-ink">{formatNumber(total)}</span> {total === 1 ? 'group' : 'groups'}
              {filtered ? ' match the current view.' : ' in this tenant.'}
            </>
          ) : (
            'Security, Microsoft 365 and distribution groups.'
          )
        }
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            New group
          </Button>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
          <SearchInput value={query.search} onSearch={(search) => list.set({ search })} label="Search groups" placeholder="Search name, email or description…" className="w-full sm:max-w-96" />
          <Select label="Group type" value={query.kind} onChange={(kind) => list.set({ kind })} options={kindOptions} filtered={query.kind !== ''} />
          {filtered && (
            <button type="button" onClick={() => list.set({ search: '', kind: '' })} className="text-sm font-semibold text-coral-ink hover:underline">
              Clear filters
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {selected.size > 0 && (
            <motion.div
              key="group-bar"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div role="toolbar" aria-label="Actions for selected groups" className="flex items-center gap-3 border-b border-line bg-coral-wash/60 px-4 py-2 sm:px-6">
                <p className="flex items-center gap-2 text-sm font-semibold" aria-live="polite">
                  <span className="tabular grid h-6 min-w-6 place-items-center rounded-full bg-coral px-1.5 text-xs text-on-coral">{formatNumber(selected.size)}</span>
                  selected
                </p>
                <span className="h-5 w-px bg-line" aria-hidden />
                <button
                  type="button"
                  onClick={() => setToDelete([...selected.values()])}
                  className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-danger transition-colors hover:bg-danger-wash"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {groups.isPending ? (
          <Loading label="Loading groups…" />
        ) : groups.isError && !groups.data ? (
          <ErrorState error={groups.error} onRetry={() => groups.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title={filtered ? 'No groups match these filters' : 'No groups yet'}>
            {query.search ? `Nothing found for “${query.search}”. Check the spelling or clear the filters.` : filtered ? 'Change the type filter.' : 'Create a group to share access, licenses and mail.'}
          </EmptyState>
        ) : (
          <GroupsTable
            rows={rows}
            selected={selected}
            onToggle={toggle}
            onTogglePage={togglePage}
            onManage={setManage}
            onDelete={(g) => setToDelete([g])}
            sort={query.sort}
            onSort={(sort) => list.set({ sort })}
            kind={query.kind}
            onKind={(kind) => list.set({ kind })}
            stale={groups.isPlaceholderData}
          />
        )}

        {groups.data && total > 0 && (
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
              itemLabel="groups"
              busy={groups.isFetching}
            />
          </div>
        )}
      </Panel>

      {manage && <ManageGroupDialog group={manage} onClose={() => setManage(null)} />}
      {creating && (
        <CreateGroupDialog
          onClose={() => setCreating(false)}
          onCreated={(g) => {
            setCreating(false)
            setManage(g) // straight on to members, owners and licenses
          }}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          open
          onClose={() => setToDelete(null)}
          onConfirm={() => remove.mutateAsync(toDelete.map((g) => g.id))}
          title={`Delete ${who(toDelete.map((g) => g.displayName), 'groups')}?`}
          body={
            <>
              Members lose any access and licenses that came from {toDelete.length === 1 ? 'this group' : 'these groups'}. Microsoft 365 groups can be restored for 30 days; security groups and distribution lists
              cannot.
            </>
          }
          confirmLabel={toDelete.length === 1 ? 'Delete group' : `Delete ${toDelete.length} groups`}
          danger
        />
      )}
    </div>
  )
}
