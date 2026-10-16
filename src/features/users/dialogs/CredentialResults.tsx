import { Check, Copy, Download, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/components/ui/admin'
import { notify } from '@/components/ui/Toaster'
import type { CredentialResult } from '../types'

const csvCell = (v = '') => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

/** Builds the CSV in the browser and hands it to the user; nothing is uploaded or kept. */
function downloadCsv(results: CredentialResult[], kind: 'password' | 'pass') {
  const ok = results.filter((r) => r.secret)
  const head = kind === 'pass' ? ['UPN', 'TAP', 'Expires'] : ['UPN', 'Password']
  const lines = ok.map((r) => (kind === 'pass' ? [r.upn, r.secret, r.expiresAt] : [r.upn, r.secret]).map(csvCell).join(','))
  const blob = new Blob([[head.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
  const a = Object.assign(document.createElement('a'), { href: url, download: `${kind === 'pass' ? 'tap' : 'passwords'}-${stamp}.csv` })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** One-time display of generated passwords or passes. Nothing here is persisted. */
export function CredentialResults({ results, kind, note }: { results: CredentialResult[]; kind: 'password' | 'pass'; note?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  const ok = results.filter((r) => r.secret)
  const label = kind === 'pass' ? 'TAP' : 'Password'

  async function copyAll() {
    const text = ok.map((r) => `${r.upn}\t${r.secret}${r.expiresAt ? `\t${r.expiresAt}` : ''}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      notify.success(`Copied ${ok.length} ${kind === 'password' ? 'password' : 'pass'}${ok.length === 1 ? '' : 'es'}`)
    } catch {
      notify.error('Couldn’t copy to the clipboard', { description: 'Select the values and copy them by hand.' })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button type="button" variant="secondary" size="sm" disabled={ok.length === 0} onClick={() => downloadCsv(results, kind)}>
          <Download className="size-4" aria-hidden />
          Download CSV
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={ok.length === 0} onClick={copyAll}>
          {copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? 'Copied' : 'Copy all'}
        </Button>
        <span className="text-sm text-ink-3">{note ?? `CSV contains UPN + ${label.toLowerCase()}.`}</span>
      </div>

      {ok.length > 0 && (
        <p className="flex items-start gap-2 rounded-[var(--radius-paper)] border border-warn/50 bg-warn-wash px-3 py-2 text-sm text-ink">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          Shown only once. Copy or download them now; they are not stored anywhere in this app.
        </p>
      )}

      <div className="max-h-72 overflow-auto overscroll-contain rounded-[var(--radius-paper)] border border-line">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-paper-2 text-left text-xs font-semibold tracking-wide text-ink-3 uppercase">
            <tr>
              <th scope="col" className="px-3 py-2.5">User</th>
              <th scope="col" className="px-3 py-2.5">{label}</th>
              {kind === 'pass' && <th scope="col" className="hidden px-3 py-2.5 text-right sm:table-cell">Expires</th>}
            </tr>
          </thead>
          <tbody>
            {results.map((r) =>
              r.secret ? (
                <tr key={r.upn} className="border-t border-line">
                  <td className="max-w-[14rem] truncate px-3 py-2.5 text-ink-2" title={r.upn}>
                    {r.upn}
                  </td>
                  <td className="px-3 py-2.5">
                    <code className="rounded bg-paper-2 px-1.5 py-0.5 font-semibold whitespace-nowrap select-all">{r.secret}</code>
                  </td>
                  {kind === 'pass' && <td className="tabular hidden px-3 py-2.5 text-right text-xs whitespace-nowrap text-ink-3 sm:table-cell">{r.expiresAt && formatDateTime(r.expiresAt)}</td>}
                </tr>
              ) : (
                <tr key={r.upn} className="border-t border-line">
                  <td colSpan={kind === 'pass' ? 3 : 2} className="px-3 py-2.5 text-danger [overflow-wrap:anywhere]">
                    {r.upn} — {r.error ?? 'Failed'}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
