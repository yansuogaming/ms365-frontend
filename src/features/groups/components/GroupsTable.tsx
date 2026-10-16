import { ArrowDown, ArrowUp, ArrowUpDown, Settings2, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { formatDate, formatDateTime, Tag } from '@/components/ui/admin'
import { Select, type SelectOption } from '@/components/ui/Select'
import type { GroupKind, GroupListQuery, GroupRow, GroupSort } from '../types'

interface GroupsTableProps {
  rows: GroupRow[]
  selected: Map<string, GroupRow>
  onToggle: (row: GroupRow, checked: boolean) => void
  onTogglePage: (selectPage: boolean) => void
  onManage: (row: GroupRow) => void
  onDelete: (row: GroupRow) => void
  sort: GroupSort
  onSort: (sort: GroupSort) => void
  kind: GroupListQuery['kind']
  onKind: (kind: GroupListQuery['kind']) => void
  stale: boolean
}

export const kindOptions: SelectOption<GroupListQuery['kind']>[] = [
  { value: '', label: 'Any type' },
  { value: 'Microsoft 365', label: 'Microsoft 365' },
  { value: 'Security', label: 'Security' },
  { value: 'Mail-enabled security', label: 'Mail-enabled security' },
  { value: 'Distribution', label: 'Distribution' },
]

const sortOptions: SelectOption<GroupSort>[] = [
  { value: 'displayName:asc', label: 'Name A–Z' },
  { value: 'displayName:desc', label: 'Name Z–A' },
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
]

export function KindTag({ kind }: { kind: GroupKind }) {
  return <Tag tone={kind === 'Microsoft 365' ? 'coral' : kind === 'Distribution' ? 'warn' : 'neutral'}>{kind}</Tag>
}

function SortHeader({ label, k, sort, onSort, className = '' }: { label: string; k: 'displayName' | 'createdAt'; sort: GroupSort; onSort: (s: GroupSort) => void; className?: string }) {
  const [key, dir] = sort.split(':') as ['displayName' | 'createdAt', 'asc' | 'desc']
  const active = key === k
  const next: GroupSort = active ? `${k}:${dir === 'asc' ? 'desc' : 'asc'}` : k === 'displayName' ? 'displayName:asc' : 'createdAt:desc'
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th scope="col" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={`px-3 py-3 font-semibold ${className}`}>
      <button type="button" onClick={() => onSort(next)} className={`inline-flex items-center gap-1.5 uppercase transition-colors hover:text-ink ${active ? 'text-ink' : ''}`}>
        {label}
        <Icon className={`size-3.5 ${active ? 'text-coral-ink' : 'opacity-60'}`} aria-hidden />
      </button>
    </th>
  )
}

/** The group name opens Manage, like the Manage button. */
function NameButton({ row, onManage }: { row: GroupRow; onManage: (r: GroupRow) => void }) {
  return (
    <button type="button" onClick={() => onManage(row)} className="block max-w-full min-w-0 text-left">
      <span className="block truncate font-semibold hover:text-coral-ink hover:underline">{row.displayName}</span>
      {row.description && <span className="block truncate text-xs text-ink-3">{row.description}</span>}
    </button>
  )
}

export function GroupsTable({ rows, selected, onToggle, onTogglePage, onManage, onDelete, sort, onSort, kind, onKind, stale }: GroupsTableProps) {
  const onPage = rows.filter((r) => selected.has(r.id)).length
  const all = rows.length > 0 && onPage === rows.length

  return (
    <div className={`transition-opacity ${stale ? 'opacity-60' : ''}`} aria-busy={stale}>
      {/* phones: one card per group */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <Checkbox
            checked={all}
            indeterminate={selected.size > 0 && !all}
            onChange={() => onTogglePage(selected.size === 0)}
            label={<span className="text-ink-2">{selected.size ? 'Clear selection' : 'Select page'}</span>}
          />
          <Select label="Sort by" value={sort} onChange={onSort} options={sortOptions} />
        </div>
        <ul className="divide-y divide-line">
          {rows.map((g) => {
            const on = selected.has(g.id)
            return (
              <li key={g.id} className={`flex gap-3 px-4 py-3.5 ${on ? 'bg-coral-wash/60' : ''}`}>
                <Checkbox checked={on} onChange={(c) => onToggle(g, c)} aria-label={`Select ${g.displayName}`} className="pt-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <NameButton row={g} onManage={onManage} />
                    <KindTag kind={g.kind} />
                  </div>
                  {g.mail && <p className="mt-1 truncate text-sm text-ink-2">{g.mail}</p>}
                  <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
                    <span>{g.membership}</span>
                    <time dateTime={g.createdAt}>{formatDateTime(g.createdAt)}</time>
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* tablet and up */}
      <div className="@container hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] table-fixed text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-3">
              <th scope="col" className="w-14 py-3 pl-6">
                <Checkbox
                  checked={all}
                  indeterminate={selected.size > 0 && !all}
                  onChange={() => onTogglePage(selected.size === 0)}
                  aria-label={selected.size ? 'Clear selection' : 'Select all groups on this page'}
                />
              </th>
              <SortHeader label="Name" k="displayName" sort={sort} onSort={onSort} className="w-[26%]" />
              <th scope="col" className="w-40 px-3 py-3">
                <Select variant="header" label="Filter by type" display="Type" filtered={kind !== ''} value={kind} onChange={onKind} options={kindOptions} />
              </th>
              <th scope="col" className="px-3 py-3 font-semibold uppercase">Email</th>
              <th scope="col" className="hidden w-32 px-3 py-3 font-semibold uppercase @min-[1100px]:table-cell">Membership</th>
              {/* narrow tables drop Membership, then Created, so the actions stay in view */}
              <SortHeader label="Created" k="createdAt" sort={sort} onSort={onSort} className="hidden w-36 @min-[900px]:table-cell" />
              <th scope="col" className="w-44 py-3 pr-6 pl-3 text-right font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const on = selected.has(g.id)
              return (
                <tr key={g.id} className={`border-b border-line transition-colors last:border-b-0 ${on ? 'bg-coral-wash/60' : 'hover:bg-paper-2'}`}>
                  <td className="py-3 pl-6">
                    <Checkbox checked={on} onChange={(c) => onToggle(g, c)} aria-label={`Select ${g.displayName}`} />
                  </td>
                  <td className="px-3 py-3">
                    <NameButton row={g} onManage={onManage} />
                  </td>
                  <td className="px-3 py-3">
                    <KindTag kind={g.kind} />
                  </td>
                  <td className="truncate px-3 py-3 text-ink-2" title={g.mail ?? undefined}>
                    {g.mail ?? <span className="text-ink-3">No email</span>}
                  </td>
                  <td className="hidden px-3 py-3 text-ink-2 @min-[1100px]:table-cell">{g.membership}</td>
                  <td className="tabular hidden px-3 py-3 whitespace-nowrap text-ink-2 @min-[900px]:table-cell">
                    <time dateTime={g.createdAt} title={formatDateTime(g.createdAt)}>
                      {formatDate(g.createdAt)}
                    </time>
                  </td>
                  <td className="py-3 pr-6 pl-3">
                    <span className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onManage(g)}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                      >
                        <Settings2 className="size-3.5" aria-hidden />
                        Manage
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(g)}
                        aria-label={`Delete ${g.displayName}`}
                        title="Delete"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-danger/40 text-danger transition-colors hover:bg-danger-wash"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
