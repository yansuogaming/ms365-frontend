import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import type { GroupMember } from '../types'

const PAGE = 8

interface MemberSectionProps {
  title: 'Members' | 'Owners'
  items: GroupMember[]
  onAdd: (ref: string) => Promise<unknown>
  onRemove: (m: GroupMember) => void
  /** Id being removed right now, to show it busy. */
  removing?: string | null
  /** Shown instead of the add box, e.g. for dynamic groups. */
  locked?: string
}

/** Members or owners: add by UPN / email / object id, remove inline, paged once the list is long. */
export function MemberSection({ title, items, onAdd, onRemove, removing, locked }: MemberSectionProps) {
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(items.length / PAGE))
  const current = Math.min(page, pages)
  const shown = items.slice((current - 1) * PAGE, current * PAGE)

  async function add(e: FormEvent) {
    e.preventDefault()
    const v = ref.trim()
    if (!v || busy) return
    setBusy(true)
    try {
      await onAdd(v)
      setRef('')
    } catch {
      // toasted globally; keep the text so it can be fixed
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-5">
      <h3 className="font-semibold">
        {title} <span className="tabular font-normal text-ink-3">({items.length})</span>
      </h3>

      {locked ? (
        <p className="rounded-[var(--radius-paper)] bg-paper-2 px-3 py-2 text-sm text-ink-2">{locked}</p>
      ) : (
        <form onSubmit={add} className="flex gap-2">
          <input
            aria-label={`Add ${title.toLowerCase().slice(0, -1)} by UPN, email or object id`}
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="UPN, email, or object id"
            autoComplete="off"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded-[var(--radius-paper)] border border-line bg-paper px-3.5 text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 hover:border-ink-3 focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)]"
          />
          <Button type="submit" variant="secondary" className="h-11" loading={busy} disabled={!ref.trim()}>
            {!busy && <Plus className="size-4" aria-hidden />}
            Add
          </Button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-ink-3">No {title.toLowerCase()}.</p>
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-paper)] border border-line">
          {shown.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{m.displayName}</span>
                <span className="block truncate text-xs text-ink-3">{m.upn ?? m.type}</span>
              </span>
              {m.type !== 'user' && <span className="shrink-0 text-xs text-ink-3">{m.type === 'servicePrincipal' ? 'app' : m.type}</span>}
              <button
                type="button"
                onClick={() => onRemove(m)}
                disabled={removing === m.id}
                aria-label={`Remove ${m.displayName}`}
                title="Remove"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-danger-wash hover:text-danger disabled:opacity-40"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > PAGE && <Pagination page={current} pageSize={PAGE} total={items.length} onPageChange={setPage} itemLabel={title.toLowerCase()} />}
    </section>
  )
}
