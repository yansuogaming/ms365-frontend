import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { notify } from '@/components/ui/Toaster'
import { useRoleDefinitions, usersApi, useUserMutation } from '../api'
import type { UserDetail } from '../types'

/** Tick the roles the user should hold; saving sends the full set. */
export function RolesTab({ user }: { user: UserDetail }) {
  const defs = useRoleDefinitions(true)
  const heldIds = (defs.data ?? []).filter((r) => user.roles.includes(r.name)).map((r) => r.id)
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const current = picked ?? new Set(heldIds)
  const [search, setSearch] = useState('')

  const save = useUserMutation(
    (roleIds: string[]) => usersApi.setRoles(user.id, roleIds),
    () => notify.success('Admin roles saved'),
  )

  const added = [...current].filter((id) => !heldIds.includes(id)).length
  const removed = heldIds.filter((id) => !current.has(id)).length
  const visible = (defs.data ?? []).filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className="flex flex-col gap-3 pt-5">
      <div className="flex items-center gap-2">
        <input
          aria-label="Search roles"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles…"
          className="h-10 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-sm outline-none hover:border-ink-3 focus:border-coral"
        />
        <span className="shrink-0 text-xs text-ink-3">{current.size ? `${current.size} role${current.size === 1 ? '' : 's'}` : 'No roles'}</span>
      </div>

      <div className="h-64 overflow-y-auto overscroll-contain rounded-[var(--radius-paper)] border border-line p-1">
        {defs.isPending ? (
          <p className="p-3 text-sm text-ink-3">Loading roles…</p>
        ) : visible.length === 0 ? (
          <p className="p-3 text-sm text-ink-3">{defs.data?.length ? `No role matches “${search}”.` : 'No admin roles loaded for this tenant.'}</p>
        ) : (
          visible.map((r) => (
            <Checkbox
              key={r.id}
              checked={current.has(r.id)}
              onChange={(on) => {
                const n = new Set(current)
                if (on) n.add(r.id)
                else n.delete(r.id)
                setPicked(n)
              }}
              label={
                <span className="flex flex-1 items-center justify-between gap-2">
                  {r.name}
                  {heldIds.includes(r.id) && <span className="text-xs text-ink-3">held</span>}
                </span>
              }
              className="rounded-md px-2.5 py-2 hover:bg-paper-2"
            />
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {(added > 0 || removed > 0) && (
          <span className="mr-auto text-sm text-ink-2">
            {added > 0 && `+${added} to add`}
            {added > 0 && removed > 0 && ' · '}
            {removed > 0 && `−${removed} to remove`}
          </span>
        )}
        <Button type="button" variant="secondary" size="sm" disabled={current.size === 0} onClick={() => setPicked(new Set())}>
          Clear
        </Button>
        <Button type="button" size="sm" loading={save.isPending} disabled={!added && !removed} onClick={() => save.mutate([...current])}>
          Save role changes
        </Button>
      </div>
    </div>
  )
}
