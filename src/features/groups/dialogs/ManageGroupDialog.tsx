import { Plus, Trash2, X } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Modal } from '@/components/ui/admin'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { ErrorState } from '@/components/ui/StateViews'
import { notify } from '@/components/ui/Toaster'
import { useSkus } from '@/features/users/api'
import { groupsApi, useGroupDetail, useGroupMutation } from '../api'
import { KindTag } from '../components/GroupsTable'
import type { GroupDetail, GroupMember, GroupRow } from '../types'
import { MemberSection } from './MemberSection'
import { Loading } from '@/components/ui/Loader'

/** Group-based licensing works on security and Microsoft 365 groups, not on distribution lists. */
const licensable = (g: GroupRow) => g.kind !== 'Distribution'

interface ProfileForm {
  name: string
  setName: (v: string) => void
  description: string
  setDescription: (v: string) => void
}

function Profile({ group, form }: { group: GroupDetail; form: ProfileForm }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Display name" value={form.name} onChange={(e) => form.setName(e.target.value)} error={form.name.trim() ? undefined : 'A group needs a name.'} />
      <Field label="Description" value={form.description} onChange={(e) => form.setDescription(e.target.value)} placeholder="Optional" />
      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-3">
        <div className="flex min-w-0 gap-1.5">
          <dt>Email:</dt>
          <dd className="truncate font-semibold text-ink-2">{group.mail ?? 'none'}</dd>
        </div>
        <div className="flex min-w-0 gap-1.5">
          <dt>Nickname:</dt>
          <dd className="truncate font-semibold text-ink-2">{group.mailNickname}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Membership:</dt>
          <dd className="font-semibold text-ink-2">{group.membership}</dd>
        </div>
        {group.isAssignableToRole && <dd className="font-semibold text-coral-ink">Entra roles can be assigned</dd>}
      </dl>
    </div>
  )
}

function Licenses({ group }: { group: GroupDetail }) {
  const skus = useSkus().data ?? []
  const [pick, setPick] = useState('')
  const available = skus.filter((s) => !group.licenses.some((l) => l.skuId === s.skuId))
  const add = useGroupMutation(
    (skuId: string) => groupsApi.addLicense(group.id, skuId),
    (_, skuId) => {
      notify.success(`Assigned ${skus.find((s) => s.skuId === skuId)?.name ?? 'the license'} to the group`)
      setPick('')
    },
  )
  const remove = useGroupMutation(
    (skuId: string) => groupsApi.removeLicense(group.id, skuId),
    () => notify.success('License removed from the group', { description: 'Members lose it unless they also have it directly.' }),
  )

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-5">
      <h3 className="font-semibold">
        Group licenses <span className="text-sm font-normal text-ink-3">— members inherit these automatically</span>
      </h3>
      {!licensable(group) ? (
        <p className="text-sm text-ink-3">Distribution lists cannot carry licenses. Use a security or Microsoft 365 group.</p>
      ) : (
        <>
          {group.licenses.length === 0 ? (
            <p className="text-sm text-ink-3">No group license assigned.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {group.licenses.map((l) => (
                <li key={l.skuId} className="inline-flex h-8 items-center gap-1 rounded-full bg-paper-2 pr-1 pl-3 text-sm">
                  {l.name}
                  <button
                    type="button"
                    onClick={() => remove.mutate(l.skuId)}
                    disabled={remove.isPending}
                    aria-label={`Remove ${l.name}`}
                    className="inline-flex size-6 items-center justify-center rounded-full text-ink-3 hover:bg-danger-wash hover:text-danger disabled:opacity-40"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Select
                label="Add a license to this group"
                variant="field"
                value={pick}
                onChange={setPick}
                display={pick ? undefined : <span className="text-ink-3">Add a license to this group…</span>}
                options={
                  available.length
                    ? available.map((s) => {
                        const free = s.enabled - s.consumed
                        return { value: s.skuId, label: s.name, hint: `${free.toLocaleString('en-US')} free` }
                      })
                    : [{ value: '', label: skus.length ? 'Every plan is already assigned' : 'No license plans in this tenant' }]
                }
              />
            </div>
            <Button type="button" variant="secondary" className="h-12" disabled={!pick} loading={add.isPending} onClick={() => add.mutate(pick)}>
              {!add.isPending && <Plus className="size-4" aria-hidden />}
              Add
            </Button>
          </div>
          <p className="text-xs text-ink-3">Any user who joins this group is automatically granted the license; leaving removes it.</p>
        </>
      )}
    </section>
  )
}

function People({ group }: { group: GroupDetail }) {
  const [removing, setRemoving] = useState<string | null>(null)
  const addMember = useGroupMutation((ref: string) => groupsApi.addMember(group.id, { ref }), (_, ref) => notify.success(`Added ${ref}`))
  const addOwner = useGroupMutation((ref: string) => groupsApi.addOwner(group.id, { ref }), (_, ref) => notify.success(`${ref} is now an owner`))
  const removeMember = useGroupMutation((m: GroupMember) => groupsApi.removeMember(group.id, m.id), (_, m) => notify.success(`Removed ${m.displayName}`))
  const removeOwner = useGroupMutation((m: GroupMember) => groupsApi.removeOwner(group.id, m.id), (_, m) => notify.success(`${m.displayName} is no longer an owner`))

  const run = (fn: typeof removeMember) => (m: GroupMember) => {
    setRemoving(m.id)
    fn.mutate(m, { onSettled: () => setRemoving(null) })
  }

  return (
    <>
      <MemberSection
        title="Members"
        items={group.members}
        onAdd={(ref) => addMember.mutateAsync(ref)}
        onRemove={run(removeMember)}
        removing={removing}
        locked={group.membership === 'Dynamic' ? `Members come from the rule${group.membershipRule ? `: ${group.membershipRule}` : ''}. They cannot be added or removed by hand.` : undefined}
      />
      <MemberSection title="Owners" items={group.owners} onAdd={(ref) => addOwner.mutateAsync(ref)} onRemove={run(removeOwner)} removing={removing} />
    </>
  )
}

/**
 * Everything below the title. Keyed on the saved name and description, so the
 * form resets once a save comes back. The footer (Delete, Save changes) stays
 * pinned while the sections scroll.
 */
function ManageBody({ group, onDelete }: { group: GroupDetail; onDelete: () => void }) {
  const [name, setName] = useState(group.displayName)
  const [description, setDescription] = useState(group.description ?? '')
  const changed = name.trim() !== group.displayName || description.trim() !== (group.description ?? '')
  const save = useGroupMutation(
    () => groupsApi.update(group.id, { displayName: name.trim(), description: description.trim() }),
    () => notify.success('Group saved'),
  )
  const formId = useId()
  return (
    <div className="flex flex-col gap-5">
      {/* its own form: Members and Owners have theirs, and forms cannot nest */}
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault()
          if (changed && name.trim()) save.mutate(undefined)
        }}
      >
        <Profile group={group} form={{ name, setName, description, setDescription }} />
      </form>
      <Licenses group={group} />
      <People group={group} />
      <div className="sticky -bottom-5 z-10 -mx-6 -mb-5 flex items-center justify-between gap-2 border-t border-line bg-paper px-6 py-4">
        <Button type="button" variant="danger" onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden />
          Delete group
        </Button>
        <Button type="submit" form={formId} disabled={!changed || !name.trim()} loading={save.isPending}>
          Save changes
        </Button>
      </div>
    </div>
  )
}

/** Manage one group: name and description, group licenses, members, owners, delete. */
export function ManageGroupDialog({ group, onClose }: { group: GroupRow; onClose: () => void }) {
  const detail = useGroupDetail(group.id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const remove = useGroupMutation(
    () => groupsApi.remove([group.id]),
    (r) => {
      if (r.failed.length) throw new Error(r.failed[0].error)
      notify.success(`Deleted ${group.displayName}`)
      onClose()
    },
  )
  const g = detail.data

  return (
    <Modal open onClose={onClose} title={g?.displayName ?? group.displayName} aside={<KindTag kind={group.kind} />} size="lg">
      {detail.isPending ? (
        <Loading label="Loading group…" />
      ) : detail.isError || !g ? (
        <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
      ) : (
        <ManageBody key={`${g.displayName}|${g.description}`} group={g} onDelete={() => setConfirmDelete(true)} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          open
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => remove.mutateAsync(undefined)}
          title={`Delete ${group.displayName}?`}
          body={
            group.kind === 'Microsoft 365'
              ? 'Its mailbox, files and Teams are deleted too. Microsoft 365 groups can be restored for 30 days.'
              : 'Members lose any access and licenses that came from this group. Security groups and distribution lists cannot be restored.'
          }
          confirmLabel="Delete group"
          danger
        />
      )}
    </Modal>
  )
}
