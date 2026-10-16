import { Plus, Trash2, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/Button'
import { ConfirmDialog, errorText, formatNumber, PageHeader } from '@/components/ui/admin'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/StateViews'
import { notify } from '@/components/ui/Toaster'
import { useSession } from '@/features/auth/useSession'
import { useListParams } from '@/lib/hooks/useListParams'
import { reportBulk, usersApi, useSkus, useUserList, useUserMutation } from './api'
import { BulkBar, type BulkAction } from './components/BulkBar'
import { UsersTable } from './components/UsersTable'
import { UsersToolbar, type ToolAction } from './components/UsersToolbar'
import { ResetPasswordDialog, TapResultDialog } from './dialogs/CredentialDialogs'
import { TAP_DEFAULT_MINUTES } from './dialogs/TapFields'
import { BulkEditDialog } from './dialogs/BulkEditDialog'
import { who } from './dialogs/FormDialog'
import { RenameDialog } from './dialogs/RenameDialog'
import { LanguageDialog } from './dialogs/SettingDialogs'
import { TwoFactorDialog } from './dialogs/TwoFactorDialog'
import { CreateUserDialog } from './create/CreateUserDialog'
import { EditUserDialog } from './edit/EditUserDialog'
import { LicenseUsageDialog } from './dialogs/LicenseUsageDialog'
import { OrgProfileDialog } from './dialogs/OrgProfileDialog'
import { DeleteFromTxtDialog } from './dialogs/ToolDialogs'
import type { CredentialResult, UserListQuery, UserRow, UserSort } from './types'

const DEFAULTS = { search: '', status: 'all', license: '', role: '', sort: 'createdAt:desc' }

type Dialog = BulkAction | Exclude<ToolAction, 'exportTxt'> | 'create' | null

/** Confirm-only bulk actions: wording and API call. */
const simple = {
  block: { title: 'Block sign-in', verb: 'Blocked', body: 'They are signed out and cannot sign in until unblocked.', run: (ids: string[]) => usersApi.block(ids, true), danger: true },
  unblock: { title: 'Unblock sign-in', verb: 'Unblocked', body: 'They can sign in again straight away.', run: (ids: string[]) => usersApi.block(ids, false), danger: false },
  forcePasswordChange: { title: 'Force password change', verb: 'Flagged', body: 'They must choose a new password at their next sign-in.', run: usersApi.forcePasswordChange, danger: false },
  revokeSessions: { title: 'Force re-auth', verb: 'Signed out', body: 'Revokes refresh tokens and browser sessions on every device. They must sign in again.', run: usersApi.revokeSessions, danger: false },
  delete: { title: 'Delete', verb: 'Deleted', body: 'Deleted users can be restored for 30 days under Deleted users. Licenses are freed right away.', run: usersApi.remove, danger: true },
} as const

export function UsersPage() {
  const tenant = useSession().data?.tenant
  const list = useListParams(DEFAULTS)
  const query: UserListQuery = {
    page: list.page,
    pageSize: list.pageSize,
    search: list.values.search,
    status: list.values.status as UserListQuery['status'],
    license: list.values.license,
    role: list.values.role,
    sort: list.values.sort as UserSort,
  }
  const users = useUserList(query)
  const skus = useSkus().data ?? []

  // selection survives paging, so ids map to rows for labels in dialogs
  const [selected, setSelected] = useState<Map<string, UserRow>>(new Map())
  const [dialog, setDialog] = useState<Dialog>(null)
  const chosen = useMemo(() => [...selected.values()], [selected])
  const clear = () => setSelected(new Map())
  const close = () => setDialog(null)
  const closeAndClear = () => {
    setDialog(null)
    clear()
  }

  const rows = users.data?.items ?? []
  const total = users.data?.total ?? 0

  function toggle(row: UserRow, checked: boolean) {
    setSelected((s) => {
      const n = new Map(s)
      if (checked) n.set(row.id, row)
      else n.delete(row.id)
      return n
    })
  }
  /** Header checkbox: with nothing selected it selects this page; otherwise it clears the whole selection, every page included. */
  function togglePage(selectPage: boolean) {
    if (!selectPage) return clear()
    setSelected((s) => {
      const n = new Map(s)
      rows.forEach((r) => n.set(r.id, r))
      return n
    })
  }

  async function onTool(tool: ToolAction) {
    if (tool !== 'exportTxt') return setDialog(tool)
    try {
      await usersApi.exportTxt(query)
      notify.success('Export started', { description: 'The TXT file lists the UPNs matching the current filters.' })
    } catch (e) {
      notify.error('Export failed', { description: errorText(e) })
    }
  }

  // TAP from the bulk bar runs straight away with the defaults, then shows the passes
  const [passes, setPasses] = useState<CredentialResult[] | null>(null)
  const quickTap = useUserMutation((ids: string[]) => usersApi.createTap(ids, TAP_DEFAULT_MINUTES, true))
  async function runTap() {
    if (quickTap.isPending) return
    const n = chosen.length
    const toastId = notify.loading(`Generating TAP for ${n} user${n === 1 ? '' : 's'}…`)
    try {
      const { results } = await quickTap.mutateAsync(chosen.map((u) => u.id))
      const ok = results.filter((r) => r.secret).length
      if (ok === results.length) notify.success(`TAP generated for ${ok} user${ok === 1 ? '' : 's'}`, { id: toastId })
      else if (ok > 0) notify.warning(`TAP generated for ${ok} of ${results.length}`, { id: toastId })
      else notify.error('TAP failed for every selected user', { id: toastId })
      setPasses(results)
    } catch {
      notify.dismiss(toastId) // the request error itself is toasted globally
    }
  }
  function onBulk(action: BulkAction) {
    if (action === 'tap') runTap()
    else setDialog(action)
  }

  const simpleAction = dialog && dialog in simple ? simple[dialog as keyof typeof simple] : null
  const runSimple = useUserMutation((ids: string[]) => simpleAction!.run(ids), (r) => reportBulk(simpleAction!.verb, r))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description={
          users.data ? (
            <>
              <span className="tabular font-semibold text-ink">{formatNumber(total)}</span> {total === 1 ? 'user matches' : 'users match'} the current view
              {tenant && <> in {tenant.domain}</>}.
            </>
          ) : (
            'Accounts in this tenant.'
          )
        }
        actions={
          <>
            <Link to="deleted" aria-label="Deleted users" title="Deleted users" className={buttonClass('ghost', 'sm', 'px-3 sm:px-4')}>
              <Trash2 className="size-4" aria-hidden />
              <span className="hidden sm:inline">Deleted users</span>
            </Link>
            <Link to="bulk-create" className={buttonClass('secondary', 'sm')}>
              <UsersRound className="size-4" aria-hidden />
              Bulk create
            </Link>
            <button type="button" onClick={() => setDialog('create')} className={buttonClass('primary', 'sm')}>
              <Plus className="size-4" aria-hidden />
              New user
            </button>
          </>
        }
      />

      <Panel>
        <UsersToolbar query={query} onChange={(c) => list.set(c)} onTool={onTool} />
        <BulkBar count={selected.size} onAction={onBulk} />

        {users.isPending ? (
          <SkeletonRows rows={8} cols={5} />
        ) : users.isError && !users.data ? (
          <ErrorState error={users.error} onRetry={() => users.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title={query.search || query.status !== 'all' || query.license || query.role ? 'No users match these filters' : 'No users yet'}>
            {query.search ? `Nothing found for “${query.search}”. Check the spelling or clear the filters.` : 'Change the filters, or create a user.'}
          </EmptyState>
        ) : (
          <UsersTable
            rows={rows}
            selected={selected}
            onToggle={toggle}
            onTogglePage={togglePage}
            sort={query.sort}
            onSort={(sort) => list.set({ sort })}
            stale={users.isPlaceholderData}
            filters={query}
            onFilter={(c) => list.set(c)}
            skus={skus}
          />
        )}

        {users.data && total > 0 && (
          <div className="border-t border-line px-6 py-4">
            <Pagination
              page={list.page}
              pageSize={list.pageSize}
              total={total}
              onPageChange={(p) => {
                list.setPage(p)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onPageSizeChange={list.setPageSize}
              itemLabel="users"
              busy={users.isFetching}
            />
          </div>
        )}
      </Panel>

      {/* dialogs */}
      {simpleAction && (
        <ConfirmDialog
          open
          onClose={close}
          onConfirm={async () => {
            await runSimple.mutateAsync(chosen.map((u) => u.id))
            clear()
          }}
          title={`${simpleAction.title}: ${who(chosen.map((u) => u.displayName))}?`}
          body={simpleAction.body}
          confirmLabel={simpleAction.title}
          danger={simpleAction.danger}
        />
      )}
      {dialog === 'edit' && chosen.length === 1 && <EditUserDialog user={chosen[0]} onClose={closeAndClear} />}
      {dialog === 'edit' && chosen.length > 1 && <BulkEditDialog users={chosen} onClose={close} onDone={closeAndClear} />}
      {dialog === 'rename' && chosen.length > 0 && <RenameDialog users={chosen} onClose={close} onDone={closeAndClear} />}
      {dialog === 'twoFactor' && chosen.length > 0 && <TwoFactorDialog users={chosen} onClose={closeAndClear} onDone={() => {}} />}
      {dialog === 'language' && <LanguageDialog users={chosen} onClose={close} onDone={closeAndClear} />}
      {dialog === 'resetPassword' && <ResetPasswordDialog users={chosen} onClose={closeAndClear} onDone={() => {}} />}
      {passes && (
        <TapResultDialog
          results={passes}
          minutes={TAP_DEFAULT_MINUTES}
          onClose={() => {
            setPasses(null)
            clear()
          }}
        />
      )}
      {dialog === 'licenseUsage' && <LicenseUsageDialog onClose={close} />}
      {dialog === 'orgProfile' && <OrgProfileDialog onClose={close} />}
      {dialog === 'deleteTxt' && <DeleteFromTxtDialog onClose={close} />}
      {dialog === 'create' && <CreateUserDialog onClose={close} />}
    </div>
  )
}
