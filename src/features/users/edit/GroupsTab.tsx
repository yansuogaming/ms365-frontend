import { useQuery } from '@tanstack/react-query'
import { RefreshCw, UserMinus, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchInput } from '@/components/ui/SearchInput'
import { ErrorState } from '@/components/ui/StateViews'
import { notify } from '@/components/ui/Toaster'
import { useGroupOptions, usersApi, useUserMutation } from '../api'
import type { UserDetail } from '../types'

/** Joined groups load on demand (one Graph call per user), then can be changed. */
export function GroupsTab({ user }: { user: UserDetail }) {
  const [load, setLoad] = useState(false)
  const joined = useQuery({ queryKey: ['users', 'groups', user.id], queryFn: () => usersApi.userGroups(user.id), enabled: load })
  const all = useGroupOptions(load)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string[]>([])

  const change = useUserMutation(
    (c: { add: string[]; remove: string[] }) => usersApi.changeGroups(user.id, c),
    (_r, c) => {
      notify.success(c.add.length ? `Added to ${c.add.length} group${c.add.length === 1 ? '' : 's'}` : 'Removed from the group')
      setAdding([])
      joined.refetch()
    },
  )

  const joinedIds = new Set((joined.data ?? []).map((g) => g.id))
  const visible = (joined.data ?? []).filter((g) => g.displayName.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-3 pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" className="h-10" loading={joined.isFetching} onClick={() => (load ? joined.refetch() : setLoad(true))}>
          {!joined.isFetching && <RefreshCw className="size-4" aria-hidden />}
          {load ? 'Reload' : 'Load groups'}
        </Button>
        <SearchInput value={search} onSearch={setSearch} delay={0} label="Search joined groups" placeholder="Search joined groups…" className="min-w-0 flex-1" />
        <span className="text-xs text-ink-3">{!load ? 'Click Load to fetch' : joined.data ? `${joined.data.length} joined` : ''}</span>
      </div>

      <div className="min-h-48 overflow-auto rounded-[var(--radius-paper)] border border-line sm:max-h-72">
        {!load ? (
          <p className="flex items-center gap-2 p-4 text-sm text-ink-3">
            <Users className="size-4" aria-hidden />
            Groups are not loaded yet.
          </p>
        ) : joined.isError ? (
          <ErrorState error={joined.error} onRetry={() => joined.refetch()} />
        ) : joined.isPending ? (
          <p className="p-4 text-sm text-ink-3">Loading groups…</p>
        ) : visible.length === 0 ? (
          <p className="p-4 text-sm text-ink-3">{joined.data?.length ? 'No joined group matches.' : 'Not a member of any group.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((g) => (
              <li key={g.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{g.displayName}</span>
                <Button type="button" variant="ghost" size="sm" disabled={change.isPending} onClick={() => change.mutate({ add: [], remove: [g.id] })}>
                  <UserMinus className="size-4" aria-hidden />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {load && joined.data && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <MultiSelect
            label="Add to groups"
            className="flex-1"
            value={adding}
            onChange={setAdding}
            placeholder="Select groups…"
            loading={all.isPending}
            options={(all.data ?? []).filter((g) => !joinedIds.has(g.id)).map((g) => ({ value: g.id, label: g.displayName }))}
          />
          <Button type="button" className="h-12" disabled={!adding.length} loading={change.isPending && adding.length > 0} onClick={() => change.mutate({ add: adding, remove: [] })}>
            Add{adding.length > 0 && ` (${adding.length})`}
          </Button>
        </div>
      )}
    </div>
  )
}
