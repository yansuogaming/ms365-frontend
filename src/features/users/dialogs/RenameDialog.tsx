import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { reportBulk, useOrgProfile, usersApi, useUserMutation } from '../api'
import type { RenameChange, UserRow } from '../types'
import { FormDialog } from '@/components/ui/FormDialog'

type Target = 'displayName' | 'upn' | 'both'
type Method = 'prefix' | 'suffix' | 'replace' | 'set' | 'each'

const targets: [Target, string][] = [
  ['displayName', 'Display name'],
  ['upn', 'Username (UPN)'],
  ['both', 'Both'],
]
const methods: [Method, string][] = [
  ['prefix', 'Add prefix'],
  ['suffix', 'Add suffix'],
  ['replace', 'Find & replace'],
  ['set', 'Set new'],
  ['each', 'One by one'],
]

const LOCAL = /^[a-z0-9._'-]{1,64}$/i
const localPart = (upn: string) => upn.slice(0, upn.lastIndexOf('@'))
const domainPart = (upn: string) => upn.slice(upn.lastIndexOf('@'))

/** Turns "Ana Lee" into "ana.lee" for a username. */
const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9._'-]/g, '')

function Segmented<V extends string>({ label, value, onChange, options }: { label: string; value: V; onChange: (v: V) => void; options: [V, string][] }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-14 shrink-0 text-sm font-semibold">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className="h-8 rounded-full border border-line px-3 text-sm font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink aria-checked:border-ink aria-checked:bg-ink aria-checked:text-paper"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Rename one or many users with rules, or one by one; optionally move them to another verified domain. */
export function RenameDialog({ users, onClose, onDone }: { users: UserRow[]; onClose: () => void; onDone: () => void }) {
  const [target, setTarget] = useState<Target>('displayName')
  // one user: editing the names directly is the common case
  const [method, setMethod] = useState<Method>(users.length === 1 ? 'each' : 'prefix')
  /** '' keeps each user's current domain. */
  const [domain, setDomain] = useState('')
  const verified = useOrgProfile(true).data?.domains.filter((d) => d.isVerified).map((d) => d.name) ?? []
  const [text, setText] = useState('')
  const [find, setFind] = useState('')
  const [each, setEach] = useState<Record<string, { displayName: string; upnLocal: string }>>(() =>
    Object.fromEntries(users.map((u) => [u.id, { displayName: u.displayName, upnLocal: localPart(u.upn) }])),
  )

  const touchesName = target !== 'upn'
  const touchesUpn = target !== 'displayName'

  /** Applies the rule to one value; `n` is the 1-based position for "Set new". */
  function apply(value: string, n: number, isUpn: boolean) {
    const t = isUpn ? slug(text) : text
    switch (method) {
      case 'prefix':
        return t + value
      case 'suffix':
        return value + t
      case 'replace':
        return find ? value.split(find).join(isUpn ? slug(text) : text) : value
      case 'set':
        return (text.includes('{n}') ? t.replaceAll('{n}', String(n)) : users.length > 1 ? `${t}${n}` : t) || value
      default:
        return value
    }
  }

  // cheap to compute, so it simply follows every keystroke
  const preview = users.map((u, i) => {
    const oldLocal = localPart(u.upn)
    const displayName = method === 'each' ? each[u.id].displayName.trim() : touchesName ? apply(u.displayName, i + 1, false) : u.displayName
    const oldDomain = domainPart(u.upn).slice(1)
    const newDomain = touchesUpn || method === 'each' ? domain || oldDomain : oldDomain
    const upnLocal = method === 'each' ? each[u.id].upnLocal.trim().toLowerCase() : touchesUpn ? apply(oldLocal, i + 1, true).toLowerCase() : oldLocal
    return { user: u, displayName, upnLocal, newDomain, domainChanged: newDomain !== oldDomain, nameChanged: displayName !== u.displayName, upnChanged: upnLocal !== oldLocal || newDomain !== oldDomain }
  })

  const problems = preview.flatMap((p) => {
    const out: string[] = []
    if (p.upnChanged && !LOCAL.test(p.upnLocal)) out.push(`${p.user.displayName}: "${p.upnLocal}" is not a valid username`)
    if (p.nameChanged && !p.displayName) out.push(`${p.user.displayName}: display name is empty`)
    return out
  })
  const seen = new Map<string, number>()
  preview.forEach((p) => {
    const full = `${p.upnLocal}@${p.newDomain}`
    seen.set(full, (seen.get(full) ?? 0) + 1)
  })
  const duplicates = [...seen].filter(([, n]) => n > 1).map(([upn]) => upn)
  const changes: RenameChange[] = preview
    .filter((p) => p.nameChanged || p.upnChanged)
    .map((p) => ({ id: p.user.id, ...(p.nameChanged && { displayName: p.displayName }), ...(p.upnChanged && { upnLocal: p.upnLocal }), ...(p.domainChanged && { domain: p.newDomain }) }))

  const run = useUserMutation(
    () => usersApi.renameMany(changes),
    (r) => {
      reportBulk('Renamed', r)
      onDone()
    },
  )

  return (
    <FormDialog
      open
      onClose={onClose}
      title={users.length === 1 ? `Rename ${users[0].displayName}` : `Rename · ${users.length} users`}
      submitLabel={changes.length ? `Rename ${changes.length} user${changes.length === 1 ? '' : 's'}` : 'Rename'}
      onSubmit={() => run.mutate(undefined)}
      busy={run.isPending}
      disabled={!changes.length || problems.length > 0 || duplicates.length > 0}
      size="lg"
    >
      {method !== 'each' && <Segmented label="Change" value={target} onChange={setTarget} options={targets} />}
      <Segmented label="How" value={method} onChange={setMethod} options={methods} />
      {(touchesUpn || method === 'each') && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="w-14 shrink-0 text-sm font-semibold">Domain</span>
          <Select
            label="Domain"
            variant="field"
            className="sm:w-80"
            value={domain}
            onChange={setDomain}
            options={[{ value: '', label: 'Keep current domain' }, ...verified.map((d) => ({ value: d, label: d }))]}
          />
        </div>
      )}

      {method === 'replace' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Find" value={find} onChange={(e) => setFind(e.target.value)} autoComplete="off" />
          <Field label="Replace with" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        </div>
      ) : method === 'each' ? null : (
        <Field
          label={method === 'prefix' ? 'Prefix to add' : method === 'suffix' ? 'Suffix to add' : 'New value'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={method === 'prefix' ? "e.g. 'pit-'" : method === 'suffix' ? "e.g. '-2026'" : 'e.g. student{n}'}
          hint={method === 'set' ? 'Use {n} for 1, 2, 3… When several users share one value, a number is added for you.' : touchesUpn ? 'For usernames, spaces become dots and accents are removed.' : undefined}
          autoComplete="off"
        />
      )}

      <div>
        <p className="mb-2 text-sm text-ink-2">
          Preview: <span className="font-semibold text-ok">green</span> will change.{domain ? ` Usernames move to @${domain}.` : " Usernames keep their current domain."}
        </p>
        <div className="max-h-72 overflow-auto rounded-[var(--radius-paper)] border border-line">
          <ul className="divide-y divide-line text-sm">
            {preview.map((p) =>
              method === 'each' ? (
                <li key={p.user.id} className="grid gap-2 px-3 py-2.5 sm:grid-cols-2">
                  <input
                    aria-label={`Display name for ${p.user.upn}`}
                    value={each[p.user.id].displayName}
                    onChange={(e) => setEach({ ...each, [p.user.id]: { ...each[p.user.id], displayName: e.target.value } })}
                    className="h-10 rounded-[var(--radius-paper)] border border-line bg-paper px-3 outline-none hover:border-ink-3 focus:border-coral"
                  />
                  <span className="flex items-center rounded-[var(--radius-paper)] border border-line bg-paper focus-within:border-coral hover:border-ink-3">
                    <input
                      aria-label={`Username for ${p.user.upn}`}
                      value={each[p.user.id].upnLocal}
                      onChange={(e) => setEach({ ...each, [p.user.id]: { ...each[p.user.id], upnLocal: e.target.value } })}
                      className="h-10 min-w-0 flex-1 bg-transparent px-3 outline-none"
                    />
                    <span className="truncate pr-3 text-ink-3">@{p.newDomain}</span>
                  </span>
                </li>
              ) : (
                <li key={p.user.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2">
                  <span className="min-w-0 truncate text-ink-3">{target === 'upn' ? p.user.upn : p.user.displayName}</span>
                  <ArrowRight className="size-4 text-ink-3" aria-hidden />
                  <span className="min-w-0 truncate">
                    {touchesName && <span className={p.nameChanged ? 'font-semibold text-ok' : 'text-ink-2'}>{p.displayName}</span>}
                    {target === 'both' && <span className="text-ink-3"> · </span>}
                    {touchesUpn && (
                      <span className={p.upnChanged ? 'font-semibold text-ok' : 'text-ink-2'}>
                        {p.upnLocal}
                        <span className={p.domainChanged ? "font-semibold text-ok" : "font-normal text-ink-3"}>@{p.newDomain}</span>
                      </span>
                    )}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>

      {(problems.length > 0 || duplicates.length > 0) && (
        <ul role="alert" className="flex flex-col gap-1 rounded-[var(--radius-paper)] border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {problems.slice(0, 4).map((p) => (
            <li key={p}>{p}</li>
          ))}
          {duplicates.slice(0, 3).map((d) => (
            <li key={d}>{d} would be used by more than one user</li>
          ))}
        </ul>
      )}
    </FormDialog>
  )
}
