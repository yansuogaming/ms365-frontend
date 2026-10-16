import { Building2, ChartPie, FileDown, FileX2, Filter, Wrench, X } from 'lucide-react'
import { Menu } from '@/components/ui/Menu'
import { SearchInput } from '@/components/ui/SearchInput'
import { DropdownChevron, dropdownTriggerClass, Select } from '@/components/ui/Select'
import { useRoleDefinitions, useRoles, useSkus } from '../api'
import { licenseOptions, statusOptions } from './UsersTable'
import type { UserListQuery } from '../types'

export type ToolAction = 'licenseUsage' | 'orgProfile' | 'exportTxt' | 'deleteTxt'

interface UsersToolbarProps {
  query: Pick<UserListQuery, 'search' | 'status' | 'license' | 'role'>
  onChange: (changes: Partial<Record<'search' | 'status' | 'license' | 'role', string>>) => void
  onTool: (tool: ToolAction) => void
}

export function UsersToolbar({ query, onChange, onTool }: UsersToolbarProps) {
  const skus = useSkus().data ?? []
  const roles = useRoles().data ?? []
  const definitions = useRoleDefinitions(true).data ?? []
  const held = new Map(roles.map((r) => [r.name, r.memberCount]))
  // assignable admin roles first; roles held but missing from the catalogue still appear
  const roleNames = [...new Set([...definitions.map((d) => d.name), ...roles.map((r) => r.name)])]
  const filtered = query.status !== 'all' || query.license || query.role || query.search

  return (
    // phone: search + Tools, then status, then the two filters side by side; sm+: one wrapping row
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-4 sm:px-6">
      <SearchInput
        value={query.search}
        onSearch={(search) => onChange({ search })}
        label="Search users"
        placeholder="Search users…"
        className="order-1 flex-1 sm:max-w-80"
      />

      <div role="radiogroup" aria-label="Status" className="order-3 flex h-10 w-full items-center rounded-full border border-line bg-paper p-1 sm:order-2 sm:w-auto">
        {statusOptions.map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={query.status === s.value}
            onClick={() => onChange({ status: s.value })}
            className="h-8 flex-1 rounded-full px-3.5 text-sm font-semibold text-ink-2 transition-colors hover:text-ink aria-checked:bg-ink aria-checked:text-paper sm:flex-none"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="order-4 grid w-full grid-cols-2 gap-2 sm:order-3 sm:flex sm:w-auto">
        <Select
          label="License"
          value={query.license}
          onChange={(license) => onChange({ license })}
          className="min-w-0 sm:max-w-60"
          options={licenseOptions(skus).map((o) => (o.value === '' ? { ...o, label: 'Any license' } : o))}
        />
        <Select
          label="Filter by role"
          icon={<Filter className="size-4 shrink-0 text-ink-2" aria-hidden />}
          display={query.role === '' ? 'Roles' : query.role === 'any' ? 'Admins only' : query.role}
          filtered={query.role !== ''}
          value={query.role}
          onChange={(role) => onChange({ role })}
          className="min-w-0 sm:max-w-64"
          options={[
            { value: '', label: 'Any role' },
            { value: 'any', label: 'Admins only' },
            // every admin role, with how many users hold it when known
            ...roleNames.map((name) => ({ value: name, label: name, hint: held.get(name) ? String(held.get(name)) : undefined, group: 'Admin roles' })),
          ]}
        />
      </div>

      {filtered && (
        <button
          type="button"
          onClick={() => {
            onChange({ search: '', status: 'all', license: '', role: '' })
          }}
          className="order-5 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-coral-ink hover:bg-coral-wash sm:order-4"
        >
          <X className="size-4" aria-hidden />
          Clear filters
        </button>
      )}

      <div className="order-2 sm:order-last sm:ml-auto">
        <Menu
          trigger={({ open, toggle, id }) => (
            <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id} className={dropdownTriggerClass('pill')}>
              <Wrench className="size-4 text-ink-2" aria-hidden />
              Tools
              <DropdownChevron open={open} />
            </button>
          )}
          items={[
            { label: 'License usage', icon: <ChartPie className="size-4 text-ink-3" />, onSelect: () => onTool('licenseUsage') },
            { label: 'Org profile', icon: <Building2 className="size-4 text-ink-3" />, onSelect: () => onTool('orgProfile') },
            { label: 'Export TXT', icon: <FileDown className="size-4 text-ink-3" />, onSelect: () => onTool('exportTxt') },
            { label: 'Delete from TXT…', icon: <FileX2 className="size-4" />, onSelect: () => onTool('deleteTxt'), danger: true },
          ]}
        />
      </div>
    </div>
  )
}
