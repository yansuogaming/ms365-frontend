import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Tag } from '@/components/ui/admin'
import { notify } from '@/components/ui/Toaster'
import { usersApi, useSkus, useUserDetail, useUserMutation } from '../api'
import type { UserDetail } from '../types'

/** Tick plans, then assign or remove them. Assigned plans are marked. */
export function LicenseTab({ user }: { user: UserDetail }) {
  const skus = useSkus()
  const current = useUserDetail(user.id).data ?? user
  const assigned = new Set(current.licenses.map((l) => l.skuId))
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const change = useUserMutation(
    (c: { add: string[]; remove: string[] }) => usersApi.changeLicenses(user.id, c),
    (_r, c) => {
      notify.success(c.add.length ? `Assigned ${c.add.length} license${c.add.length === 1 ? '' : 's'}` : `Removed ${c.remove.length} license${c.remove.length === 1 ? '' : 's'}`)
      setPicked(new Set())
    },
  )

  const visible = (skus.data ?? []).filter((s) => s.name.toLowerCase().includes(filter.trim().toLowerCase()))
  const toAdd = [...picked].filter((id) => !assigned.has(id))
  const toRemove = [...picked].filter((id) => assigned.has(id))

  return (
    <div className="flex flex-col gap-3 pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-ink-2">
          {current.licenses.length ? `${current.licenses.length} assigned` : 'No license assigned'}
          {picked.size > 0 && ` · ${picked.size} ticked`}
        </p>
        <input
          aria-label="Filter licenses"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter licenses…"
          className="h-10 w-full rounded-full border border-line bg-paper px-4 text-sm outline-none hover:border-ink-3 focus:border-coral sm:w-60"
        />
        <Button type="button" variant="ghost" size="sm" disabled={!picked.size} onClick={() => setPicked(new Set())}>
          Clear
        </Button>
      </div>

      <div className="max-h-72 overflow-auto rounded-[var(--radius-paper)] border border-line">
        {skus.isPending ? (
          <p className="p-4 text-sm text-ink-3">Loading licenses…</p>
        ) : visible.length === 0 ? (
          <p className="p-4 text-sm text-ink-3">{skus.data?.length ? 'No license matches.' : 'No licenses available.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((s) => {
              const has = assigned.has(s.skuId)
              const free = s.enabled - s.consumed
              return (
                <li key={s.skuId} className="flex items-center gap-3 px-3 py-1">
                  <Checkbox
                    checked={picked.has(s.skuId)}
                    onChange={(on) =>
                      setPicked((p) => {
                        const n = new Set(p)
                        if (on) n.add(s.skuId)
                        else n.delete(s.skuId)
                        return n
                      })
                    }
                    label={s.name}
                    className="min-w-0 flex-1 py-2"
                  />
                  {has ? <Tag tone="ok">Assigned</Tag> : <span className="tabular text-xs text-ink-3">{free > 0 ? `${free} free` : 'none free'}</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="danger" size="sm" disabled={!toRemove.length} loading={change.isPending && toRemove.length > 0} onClick={() => change.mutate({ add: [], remove: toRemove })}>
          Remove selected{toRemove.length > 0 && ` (${toRemove.length})`}
        </Button>
        <Button type="button" size="sm" disabled={!toAdd.length} loading={change.isPending && toAdd.length > 0} onClick={() => change.mutate({ add: toAdd, remove: [] })}>
          Assign selected{toAdd.length > 0 && ` (${toAdd.length})`}
        </Button>
      </div>
    </div>
  )
}
