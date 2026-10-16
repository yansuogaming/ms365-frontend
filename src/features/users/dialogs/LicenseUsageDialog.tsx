import { Crosshair, Download, FileUp, Play, Search } from 'lucide-react'
import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { errorText, formatDate, formatDateTime, formatNumber, Modal, Tag } from '@/components/ui/admin'
import { Field } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { notify } from '@/components/ui/Toaster'
import { usersApi, useUsageScan } from '../api'
import type { UsagePeriod, UsageRow, UsageStatus, UsageSummary } from '../types'
import { Spinner } from '@/components/ui/Loader'

type Show = 'all' | 'licensed' | UsageStatus

const statusLook: Record<UsageStatus, { label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' | 'coral' }> = {
  active: { label: 'Active', tone: 'ok' },
  inactive: { label: 'Inactive', tone: 'warn' },
  auditLimited: { label: 'Audit limited', tone: 'coral' },
  neverUsed: { label: 'Never used', tone: 'danger' },
  noLicense: { label: 'No license', tone: 'neutral' },
}

const cards: { key: Show; label: string; value: (s: UsageSummary) => number; hint: string }[] = [
  { key: 'licensed', label: 'Licensed', value: (s) => s.licensed, hint: 'Hold at least one license' },
  { key: 'active', label: 'Active', value: (s) => s.active, hint: 'Activity within the active days' },
  { key: 'inactive', label: 'Inactive', value: (s) => s.inactive, hint: 'Licensed, no activity within the active days' },
  { key: 'auditLimited', label: 'Audit limited', value: (s) => s.auditLimited, hint: 'Usage data hidden by tenant privacy settings' },
  { key: 'neverUsed', label: 'Never used', value: (s) => s.neverUsed, hint: 'Licensed, never signed in' },
  { key: 'noLicense', label: 'No license', value: (s) => s.noLicense, hint: 'No license assigned' },
  { key: 'all', label: 'Scanned', value: (s) => s.scanned, hint: 'Every user in this scan' },
]

// most actionable first: the reason to open this tool is finding unused licenses
const showOptions: { value: Show; label: string }[] = [
  { value: 'inactive', label: 'Inactive' },
  { value: 'neverUsed', label: 'Never used' },
  { value: 'auditLimited', label: 'Audit limited' },
  { value: 'noLicense', label: 'No license' },
  { value: 'licensed', label: 'Licensed' },
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All scanned' },
]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Reads "user@domain.com" or "mail:pass" lines. Only the email is kept: anything
 * after the first colon is dropped here and never leaves the browser.
 */
function parseTargets(raw: string) {
  const lines = raw.split(/[\r\n,;]+/).map((l) => l.trim()).filter(Boolean)
  const emails = lines.map((l) => l.split(':')[0].trim().toLowerCase())
  const valid = [...new Set(emails.filter((e) => EMAIL.test(e)))]
  return { valid, ignored: lines.length - emails.filter((e) => EMAIL.test(e)).length }
}

function toCsv(rows: UsageRow[]) {
  const esc = (v: string | null) => `"${(v ?? '').replaceAll('"', '""')}"`
  const head = 'Status,Display name,UPN,Licenses,Last seen,Signal,Device / App'
  return [head, ...rows.map((r) => [statusLook[r.status].label, r.displayName, r.upn, r.licenses.join(' + '), r.lastSeen, r.signal, r.device].map(esc).join(','))].join('\n')
}

export function LicenseUsageDialog({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<UsagePeriod>('D30')
  const [activeDays, setActiveDays] = useState('30')
  const [maxUsers, setMaxUsers] = useState('5000')
  const [show, setShow] = useState<Show>('inactive')
  const [search, setSearch] = useState('')
  const [targets, setTargets] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const file = useRef<HTMLInputElement>(null)

  const scan = useUsageScan(jobId)
  const job = scan.data
  const running = starting || job?.state === 'running' || (Boolean(jobId) && !job)
  const parsed = parseTargets(targets)

  const days = Number(activeDays)
  const max = Number(maxUsers)
  const settingsError = !Number.isInteger(days) || days < 1 || days > 180 ? 'Active days: 1–180' : !Number.isInteger(max) || max < 1 || max > 50000 ? 'Max users: 1–50,000' : null

  async function start(onlyTargets: boolean) {
    if (settingsError) return notify.error(settingsError)
    if (onlyTargets && parsed.valid.length === 0) return notify.error('Add at least one user email to scan.')
    setStarting(true)
    try {
      const { jobId: id } = await usersApi.startUsageScan({ period, activeDays: days, maxUsers: max, ...(onlyTargets && { targets: parsed.valid }) })
      setJobId(id)
      setPage(1)
      notify.info(onlyTargets ? `Scanning ${parsed.valid.length} user${parsed.valid.length === 1 ? '' : 's'}…` : 'Scan started')
    } catch (e) {
      notify.error('Couldn’t start the scan', { description: errorText(e) })
    } finally {
      setStarting(false)
    }
  }

  async function importTxt(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > 1024 * 1024) return notify.error('The file is larger than 1 MB.')
    const text = await f.text()
    setTargets((t) => (t ? `${t.trimEnd()}\n${text}` : text))
    const { valid } = parseTargets(text)
    notify.success(`Imported ${valid.length} user${valid.length === 1 ? '' : 's'} from ${f.name}`)
  }

  const rows = useMemo(() => {
    const all = job?.rows ?? []
    const q = search.trim().toLowerCase()
    return all.filter(
      (r) =>
        (show === 'all' || (show === 'licensed' ? r.status !== 'noLicense' : r.status === show)) &&
        (!q || r.displayName.toLowerCase().includes(q) || r.upn.toLowerCase().includes(q) || r.licenses.some((l) => l.toLowerCase().includes(q))),
    )
  }, [job?.rows, show, search])
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
    Object.assign(document.createElement('a'), { href: url, download: `license-usage-${period.toLowerCase()}-${show}.csv` }).click()
    URL.revokeObjectURL(url)
    notify.success(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'}`)
  }

  const badge = running ? (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-coral-wash px-3 text-xs font-semibold text-coral-ink">
      <Spinner size="sm" className="size-4" />
      {job ? `Scanning ${formatNumber(job.progress.scanned)}/${formatNumber(job.progress.total)}` : 'Starting…'}
    </span>
  ) : job?.state === 'failed' ? (
    <Tag tone="danger">Failed</Tag>
  ) : job?.state === 'done' ? (
    <Tag tone="ok">Done</Tag>
  ) : (
    <Tag tone="ok">Ready</Tag>
  )

  const progressPct = job && job.progress.total ? (job.progress.scanned / job.progress.total) * 100 : 0

  return (
    <Modal open onClose={onClose} title="License usage" description="Find licensed users who are inactive or never signed in." aside={badge} size="xl">
      <div className="flex flex-col gap-5">
        {/* scan settings */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[7rem_7rem_8rem_10rem_minmax(12rem,1fr)_auto_auto] lg:items-end">
          <Select label="Period" showLabel variant="field" value={period} onChange={setPeriod} options={(['D7', 'D30', 'D90', 'D180'] as const).map((p) => ({ value: p, label: p }))} />
          <Field label="Active days" type="number" inputMode="numeric" min={1} max={180} value={activeDays} onChange={(e) => setActiveDays(e.target.value)} />
          <Field label="Max users" type="number" inputMode="numeric" min={1} max={50000} step={100} value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} />
          <Select label="Show" showLabel variant="field" value={show} onChange={(v) => { setShow(v); setPage(1) }} options={showOptions} />
          <Field
            label="Search"
            className="col-span-2 sm:col-span-4 lg:col-span-1"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Display name, UPN, license…"
            leading={<Search className="size-4" aria-hidden />}
            autoComplete="off"
          />
          <Button className="h-12" loading={running} onClick={() => start(false)}>
            {!running && <Play className="size-4" aria-hidden />}
            Start scan
          </Button>
          <Button variant="secondary" className="h-12" disabled={rows.length === 0} onClick={exportCsv}>
            <Download className="size-4" aria-hidden />
            Export
          </Button>
        </div>

        {/* targeted scan */}
        <div className="flex flex-col gap-2">
          <label htmlFor="usage-targets" className="text-sm font-semibold">
            Check users / TXT
          </label>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <textarea
              id="usage-targets"
              rows={2}
              value={targets}
              onChange={(e) => setTargets(e.target.value)}
              placeholder={'user@domain.com — one per line (mail:pass lines are fine; the password is dropped)'}
              spellCheck={false}
              className="min-h-12 flex-1 resize-y rounded-[var(--radius-paper)] border border-line bg-paper px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-3 hover:border-ink-3 focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)]"
            />
            <div className="grid grid-cols-2 gap-3 lg:flex">
              <Button variant="secondary" className="h-12" onClick={() => file.current?.click()}>
                <FileUp className="size-4" aria-hidden />
                Import
              </Button>
              <Button className="h-12" disabled={running || parsed.valid.length === 0} onClick={() => start(true)}>
                <Crosshair className="size-4" aria-hidden />
                Scan target{parsed.valid.length > 0 && ` (${parsed.valid.length})`}
              </Button>
              <input ref={file} type="file" accept=".txt,text/plain" onChange={importTxt} className="sr-only" tabIndex={-1} />
            </div>
          </div>
          {targets.trim() && (
            <p className="text-xs text-ink-3">
              {parsed.valid.length} user{parsed.valid.length === 1 ? '' : 's'} to scan{parsed.ignored > 0 && ` · ${parsed.ignored} line${parsed.ignored === 1 ? '' : 's'} ignored`}. Only emails are sent.
            </p>
          )}
        </div>

        {running && job && (
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-3" role="progressbar" aria-valuemin={0} aria-valuemax={job.progress.total} aria-valuenow={job.progress.scanned} aria-label="Scan progress">
            <span className="block h-full rounded-full bg-coral transition-[width] duration-500" style={{ width: `${Math.max(progressPct, 3)}%` }} />
          </div>
        )}
        {job?.state === 'failed' && <p className="text-sm text-danger">{job.error ?? 'The scan failed. Try again.'}</p>}

        {/* summary cards double as filters */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {cards.map((c) => {
            const on = show === c.key
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={on}
                title={c.hint}
                onClick={() => {
                  setShow(c.key)
                  setPage(1)
                }}
                className={`rounded-[var(--radius-paper)] border px-3.5 py-2.5 text-left transition-colors ${on ? 'border-coral bg-coral-wash' : 'border-line bg-paper hover:border-ink-3'}`}
              >
                <span className={`block text-xs font-semibold ${on ? 'text-coral-ink' : 'text-ink-2'}`}>{c.label}</span>
                <span className="tabular mt-0.5 block font-display text-2xl leading-tight font-semibold">{job ? formatNumber(c.value(job.summary)) : '0'}</span>
              </button>
            )
          })}
        </div>

        {/* results */}
        <div className="rounded-[var(--radius-paper)] border border-line">
          {pageRows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-2">
              {!job ? 'No rows yet. Start a scan to see who uses their license.' : running ? 'Scanning… rows appear when the scan finishes.' : 'No users match this view.'}
            </p>
          ) : (
            <>
              <ul className="divide-y divide-line md:hidden">
                {pageRows.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold">{r.displayName}</span>
                      <Tag tone={statusLook[r.status].tone}>{statusLook[r.status].label}</Tag>
                    </div>
                    <span className="truncate text-sm text-ink-2">{r.upn}</span>
                    <span className="text-xs text-ink-3">
                      {r.licenses.join(', ') || 'No license'} · {r.lastSeen ? `seen ${formatDate(r.lastSeen)}` : 'never seen'}
                      {r.signal && ` · ${r.signal}`}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-paper-2 text-left text-xs font-semibold tracking-wide text-ink-3 uppercase">
                      {['Status', 'Display name', 'UPN', 'License', 'Last seen', 'Signal', 'Device / App'].map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr key={r.id} className="border-b border-line last:border-b-0 hover:bg-paper-2">
                        <td className="px-4 py-3">
                          <Tag tone={statusLook[r.status].tone}>{statusLook[r.status].label}</Tag>
                        </td>
                        <td className="max-w-[12rem] truncate px-4 py-3 font-semibold">{r.displayName}</td>
                        <td className="max-w-[16rem] truncate px-4 py-3 text-ink-2" title={r.upn}>
                          {r.upn}
                        </td>
                        <td className="max-w-[14rem] truncate px-4 py-3 text-ink-2" title={r.licenses.join('\n')}>
                          {r.licenses.join(', ') || <span className="text-ink-3">—</span>}
                        </td>
                        <td className="tabular px-4 py-3 whitespace-nowrap text-ink-2">
                          {r.lastSeen ? (
                            <time dateTime={r.lastSeen} title={formatDateTime(r.lastSeen)}>
                              {formatDate(r.lastSeen)}
                            </time>
                          ) : (
                            <span className="text-ink-3">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-2">{r.signal ?? <span className="text-ink-3">—</span>}</td>
                        <td className="max-w-[12rem] truncate px-4 py-3 text-ink-2">{r.device ?? <span className="text-ink-3">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {rows.length > 0 && (
            <div className="border-t border-line px-4 py-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={rows.length}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s)
                  setPage(1)
                }}
                itemLabel="users"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
