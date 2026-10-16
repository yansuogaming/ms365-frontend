import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, formatDate, formatDateTime, formatNumber, Modal, Tag } from '@/components/ui/admin'
import { Field } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/StateViews'
import { reportBulk, useDeletedUsers, usersApi, useUserMutation } from '../api'
import { FormDialog } from '../dialogs/FormDialog'
import type { DeletedTarget, DeletedUser } from '../types'

const RETENTION_DAYS = 30
const DAY = 86_400_000

/** Days until Entra purges the account for good. */
function daysLeft(deletedAt: string) {
  return Math.max(0, Math.ceil((Date.parse(deletedAt) + RETENTION_DAYS * DAY - Date.now()) / DAY))
}

function Remaining({ deletedAt }: { deletedAt: string }) {
  const d = daysLeft(deletedAt)
  return <Tag tone={d <= 3 ? 'danger' : d <= 7 ? 'warn' : 'neutral'}>{d === 0 ? 'Purging today' : `${d} day${d === 1 ? '' : 's'} left`}</Tag>
}

type Pending =
  | { kind: 'restore' | 'purge'; user: DeletedUser }
  | { kind: 'restoreAll' | 'purgeAll' }
  | null

/** Deleted users (restorable for 30 days), opened from the Users page. */
export function DeletedUsersDialog({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const deleted = useDeletedUsers({ page, pageSize, search })
  const [pending, setPending] = useState<Pending>(null)
  const [typed, setTyped] = useState('')

  const total = deleted.data?.total ?? 0
  const rows = deleted.data?.items ?? []

  const restore = useUserMutation(usersApi.restore, (r) => reportBulk('Restored', r))
  const purge = useUserMutation(usersApi.purge, (r) => reportBulk('Permanently deleted', r))

  const allTarget: DeletedTarget = { all: true, search }
  const close = () => {
    setPending(null)
    setTyped('')
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Deleted users"
      description={`Deleted accounts stay restorable for ${RETENTION_DAYS} days, then Microsoft removes them for good.`}
      size="wide"
    >
      <div className="-mx-6 -my-5 flex min-h-full flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
          <SearchInput
            value={search}
            onSearch={(s) => {
              setSearch(s)
              setPage(1)
            }}
            label="Search deleted users"
            placeholder="Search name or UPN…"
            className="w-full sm:max-w-80"
          />
          {deleted.data && (
            <p className="text-sm text-ink-2">
              <span className="tabular font-semibold text-ink">{formatNumber(total)}</span> {search ? `match “${search}”` : 'deleted'}
            </p>
          )}
          <span className="flex w-full gap-2 sm:ml-auto sm:w-auto">
            <Button variant="secondary" size="sm" disabled={total === 0} onClick={() => setPending({ kind: 'restoreAll' })}>
              <RotateCcw className="size-4" aria-hidden />
              Restore all{total > 0 && ` (${formatNumber(total)})`}
            </Button>
            <Button variant="danger" size="sm" disabled={total === 0} onClick={() => setPending({ kind: 'purgeAll' })}>
              <Trash2 className="size-4" aria-hidden />
              Delete all{total > 0 && ` (${formatNumber(total)})`}
            </Button>
          </span>
        </div>

        <div className="flex-1">
        {deleted.isPending ? (
          <SkeletonRows rows={5} cols={4} />
        ) : deleted.isError && !deleted.data ? (
          <ErrorState error={deleted.error} onRetry={() => deleted.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title={search ? 'No deleted users match' : 'No deleted users'}>
            {search ? 'Check the spelling or clear the search.' : `Users you delete appear here for ${RETENTION_DAYS} days, so they can be restored.`}
          </EmptyState>
        ) : (
          <div className={`transition-opacity ${deleted.isPlaceholderData ? 'opacity-60' : ''}`}>
            {/* phones: cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((u) => (
                <li key={u.id} className="flex flex-col gap-2 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold">{u.displayName}</p>
                    <Remaining deletedAt={u.deletedAt} />
                  </div>
                  <p className="truncate text-sm text-ink-2">{u.upn}</p>
                  <p className="text-xs text-ink-3">Deleted {formatDateTime(u.deletedAt)}</p>
                  <div className="mt-1 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setPending({ kind: 'restore', user: u })}>
                      <RotateCcw className="size-4" aria-hidden />
                      Restore
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setPending({ kind: 'purge', user: u })}>
                      Delete permanently
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {/* tablet and up: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-semibold tracking-wide text-ink-3 uppercase">
                    <th scope="col" className="py-3 pr-3 pl-6 font-semibold">Name</th>
                    <th scope="col" className="px-3 py-3 font-semibold">UPN</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Deleted</th>
                    <th scope="col" className="py-3 pr-6 pl-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-paper-2">
                      <td className="max-w-[14rem] truncate py-3 pr-3 pl-6 font-semibold">{u.displayName}</td>
                      <td className="max-w-[22rem] truncate px-3 py-3 text-ink-2" title={u.upn}>
                        {u.upn}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-3">
                          <time dateTime={u.deletedAt} title={formatDateTime(u.deletedAt)} className="tabular text-ink-2">
                            {formatDate(u.deletedAt)}
                          </time>
                          <Remaining deletedAt={u.deletedAt} />
                        </span>
                      </td>
                      <td className="py-3 pr-6 pl-3">
                        <span className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setPending({ kind: 'restore', user: u })}>
                            <RotateCcw className="size-4" aria-hidden />
                            Restore
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setPending({ kind: 'purge', user: u })}>
                            Delete permanently
                          </Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        </div>

        {deleted.data && total > 0 && (
          <div className="sticky -bottom-5 border-t border-line bg-paper px-4 py-4 sm:px-6">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n)
                setPage(1)
              }}
              itemLabel="deleted users"
              busy={deleted.isFetching}
            />
          </div>
        )}
      </div>

      {/* single-user confirmations */}
      {pending?.kind === 'restore' && (
        <ConfirmDialog
          open
          onClose={close}
          onConfirm={() => restore.mutateAsync({ ids: [pending.user.id] })}
          title={`Restore ${pending.user.displayName}?`}
          body={`${pending.user.upn} comes back with its licenses, groups and mailbox, as before it was deleted.`}
          confirmLabel="Restore"
        />
      )}
      {pending?.kind === 'purge' && (
        <ConfirmDialog
          open
          onClose={close}
          onConfirm={() => purge.mutateAsync({ ids: [pending.user.id] })}
          title={`Permanently delete ${pending.user.displayName}?`}
          body={`${pending.user.upn} and its mailbox and OneDrive are removed for good. This cannot be undone.`}
          confirmLabel="Delete permanently"
          danger
        />
      )}
      {pending?.kind === 'restoreAll' && (
        <ConfirmDialog
          open
          onClose={close}
          onConfirm={() => restore.mutateAsync(allTarget)}
          title={`Restore ${formatNumber(total)} user${total === 1 ? '' : 's'}?`}
          body={search ? `Every deleted user matching “${search}” is restored.` : 'Every deleted user in this tenant is restored.'}
          confirmLabel="Restore all"
        />
      )}
      {pending?.kind === 'purgeAll' && (
        <FormDialog
          open
          onClose={close}
          title={`Permanently delete ${formatNumber(total)} user${total === 1 ? '' : 's'}?`}
          description={search ? `Every deleted user matching “${search}”.` : 'Every deleted user in this tenant.'}
          submitLabel="Delete all permanently"
          onSubmit={() => purge.mutateAsync(allTarget).then(close, () => {})}
          busy={purge.isPending}
          danger
          disabled={typed !== 'DELETE'}
        >
          <p className="text-ink-2">Their mailboxes and OneDrive files are removed for good. This cannot be undone.</p>
          <Field label='Type "DELETE" to confirm' value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </FormDialog>
      )}
    </Modal>
  )
}
