import { Search, ShieldX } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Select } from '@/components/ui/Select'
import { countryOptions } from '@/lib/countries'
import { LoadingState } from '@/components/ui/StateViews'
import { reportBulk, useRoleDefinitions, usersApi, useUserMutation } from '../api'
import type { BulkEditRequest, SharedField, UserRow } from '../types'
import { FormDialog } from './FormDialog'


type RoleMode = 'assign' | 'remove' | 'none'

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-paper)] border border-line p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function BulkEditDialog({ users, onClose, onDone }: { users: UserRow[]; onClose: () => void; onDone: () => void }) {
  const roles = useRoleDefinitions(true)

  const [mode, setMode] = useState<RoleMode>('none')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [roleSearch, setRoleSearch] = useState('')
  const [removeAll, setRemoveAll] = useState(false)
  const [use, setUse] = useState<Record<SharedField, boolean>>({ usageLocation: false, jobTitle: false, department: false })
  const [fields, setFields] = useState<Record<SharedField, string>>({ usageLocation: 'VN', jobTitle: '', department: '' })

  const heldRoles = useMemo(() => [...new Set(users.flatMap((u) => u.roles))], [users])
  const visibleRoles = (roles.data ?? []).filter((r) => r.name.toLowerCase().includes(roleSearch.trim().toLowerCase()))

  const save = useUserMutation(
    async () => {
      const req: BulkEditRequest = { ids: users.map((u) => u.id) }
      if (removeAll) req.removeAllRoles = true
      else if (mode !== 'none' && picked.size) req.roles = { mode, roleIds: [...picked] }
      const chosen = (Object.keys(use) as SharedField[]).filter((k) => use[k])
      if (chosen.length) req.fields = Object.fromEntries(chosen.map((k) => [k, fields[k].trim()]))

      const work: Promise<unknown>[] = []
      if (req.roles || req.removeAllRoles || req.fields) work.push(usersApi.edit(req).then((r) => reportBulk('Updated', r)))
      if (!work.length) throw new Error('Nothing to change: pick roles or tick a field first.')
      await Promise.all(work)
    },
    () => onDone(),
  )

  const toggleRole = (id: string, on: boolean) =>
    setPicked((s) => {
      const n = new Set(s)
      if (on) n.add(id)
      else n.delete(id)
      return n
    })

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Bulk edit · ${users.length} users`}
      submitLabel={`Apply to ${users.length} users`}
      onSubmit={() => save.mutate(undefined)}
      busy={save.isPending}
      size="lg"
    >
      <ul className="max-h-24 overflow-auto rounded-[var(--radius-paper)] border border-line bg-paper-2 px-3 py-2 text-sm text-ink-2">
        {users.map((u) => (
          <li key={u.id} className="truncate">
            {u.upn}
          </li>
        ))}
      </ul>

      <Section
        title="Directory roles"
        aside={
          <div role="radiogroup" aria-label="Role change" className="flex h-9 items-center rounded-full border border-line bg-paper p-1 text-sm">
            {(
              [
                ['assign', 'Assign'],
                ['remove', 'Remove'],
                ['none', 'No change'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={mode === v && !removeAll}
                disabled={removeAll}
                onClick={() => setMode(v)}
                className={`h-7 rounded-full px-3 font-semibold transition-colors disabled:opacity-40 ${
                  mode === v && !removeAll ? (v === 'remove' ? 'bg-danger text-paper' : v === 'assign' ? 'bg-ok text-paper' : 'bg-ink text-paper') : 'text-ink-2 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <p className="mb-3 text-sm text-ink-2">
          {heldRoles.length
            ? `Currently held by the selection: ${heldRoles.join(', ')}.`
            : 'None of the selected users holds an admin role (from the loaded data).'}
        </p>

        {removeAll ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-paper)] border border-danger/40 bg-danger/5 p-3 text-sm">
            <span className="text-danger">Every directory role the selected users hold will be removed.</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setRemoveAll(false)}>
              Undo
            </Button>
          </div>
        ) : (
          <fieldset disabled={mode === 'none'} className="flex flex-col gap-2 disabled:opacity-50">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search roles</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
                <input
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search roles…"
                  className="h-10 w-full rounded-full border border-line bg-paper pr-3 pl-9 text-sm outline-none hover:border-ink-3 focus:border-coral"
                />
              </label>
              <Button type="button" variant="secondary" size="sm" onClick={() => setPicked(new Set(visibleRoles.map((r) => r.id)))}>
                Select all
              </Button>
              {picked.size > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPicked(new Set())}>
                  Clear
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto overscroll-contain rounded-[var(--radius-paper)] border border-line p-1">
              {roles.isPending ? (
                <LoadingState label="Loading roles…" />
              ) : roles.isError ? (
                <p className="p-3 text-sm text-danger">Couldn’t load roles.</p>
              ) : visibleRoles.length === 0 ? (
                <p className="p-3 text-sm text-ink-3">No role matches “{roleSearch}”.</p>
              ) : (
                visibleRoles.map((r) => (
                  <Checkbox key={r.id} checked={picked.has(r.id)} onChange={(on) => toggleRole(r.id, on)} label={r.name} className="rounded-md px-2.5 py-2 hover:bg-paper-2" />
                ))
              )}
            </div>
            <p className="text-xs text-ink-3">
              {roles.data && `${roles.data.length} roles`}
              {picked.size > 0 && ` · ${picked.size} selected to ${mode}`}
            </p>
          </fieldset>
        )}

        {!removeAll && heldRoles.length > 0 && (
          <Button type="button" variant="danger" size="sm" className="mt-3" onClick={() => setRemoveAll(true)}>
            <ShieldX className="size-4" aria-hidden />
            Remove ALL current roles
          </Button>
        )}
      </Section>

      <Section title="Shared fields" aside={<span className="text-xs text-ink-3">Only ticked fields are applied</span>}>
        <div className="flex flex-col gap-3">
          <div className="grid items-center gap-2 sm:grid-cols-[11rem_1fr]">
            <Checkbox checked={use.usageLocation} onChange={(v) => setUse({ ...use, usageLocation: v })} label="Usage location" />
            <Select
              label="Usage location"
              variant="field"
              disabled={!use.usageLocation}
              value={fields.usageLocation}
              onChange={(v) => setFields({ ...fields, usageLocation: v })}
              options={countryOptions}
            />
          </div>
          {(
            [
              ['jobTitle', 'Job title'],
              ['department', 'Department'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="grid items-center gap-2 sm:grid-cols-[11rem_1fr]">
              <Checkbox checked={use[key]} onChange={(v) => setUse({ ...use, [key]: v })} label={label} />
              <input
                aria-label={label}
                disabled={!use[key]}
                value={fields[key]}
                onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                placeholder="Leave empty to clear"
                className="h-12 w-full rounded-[var(--radius-paper)] border border-line bg-paper px-4 text-base text-ink outline-none placeholder:text-ink-3 hover:border-ink-3 focus:border-coral disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      </Section>
    </FormDialog>
  )
}
