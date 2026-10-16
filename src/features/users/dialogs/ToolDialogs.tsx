import { CircleCheck, FileText, Upload } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { Field } from '@/components/ui/Field'
import { formatNumber } from '@/components/ui/admin'
import { reportBulk, usersApi, useUserMutation } from '../api'
import { FormDialog } from './FormDialog'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Reads a .txt of UPNs (one per line), previews it, and deletes after the operator types DELETE. */
export function DeleteFromTxtDialog({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<{ name: string; upns: string[]; invalid: number } | null>(null)
  const [typed, setTyped] = useState('')
  const [readError, setReadError] = useState<string>()

  const run = useUserMutation(
    () => usersApi.removeByUpn(file!.upns),
    (r) => {
      reportBulk('Deleted', r)
      onClose()
    },
  )

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 1024 * 1024) {
      setReadError('The file is larger than 1 MB. Split it and upload the parts.')
      return
    }
    const lines = (await f.text()).split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter(Boolean)
    const valid = [...new Set(lines.filter((l) => EMAIL.test(l)))]
    setReadError(valid.length ? undefined : 'No email addresses found. Put one UPN per line.')
    setFile({ name: f.name, upns: valid, invalid: lines.length - lines.filter((l) => EMAIL.test(l)).length })
    setTyped('')
  }

  const ready = file && file.upns.length > 0 && typed === 'DELETE'

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Delete users from a TXT file"
      description="One UPN per line. Deleted users stay restorable for 30 days under Deleted users."
      submitLabel={file?.upns.length ? `Delete ${formatNumber(file.upns.length)} users` : 'Delete users'}
      onSubmit={() => run.mutate(undefined)}
      busy={run.isPending}
      danger
      disabled={!ready}
      size="md"
    >
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-paper)] border border-dashed border-rule bg-paper-2 px-4 py-6 text-center transition-colors hover:border-coral">
        {file ? <FileText className="size-6 text-coral-ink" aria-hidden /> : <Upload className="size-6 text-ink-3" aria-hidden />}
        <span className="font-semibold">{file ? file.name : 'Choose a .txt file'}</span>
        <span className="text-sm text-ink-3">{file ? 'Choose another file to replace it' : 'Read on this device, up to 1 MB'}</span>
        <input type="file" accept=".txt,text/plain" onChange={onFile} className="sr-only" />
      </label>

      {readError && <p className="text-sm text-danger">{readError}</p>}

      {file && file.upns.length > 0 && (
        <>
          <div className="rounded-[var(--radius-paper)] border border-line">
            <p className="flex items-center gap-2 border-b border-line px-3 py-2 text-sm">
              <CircleCheck className="size-4 text-ok" aria-hidden />
              <span>
                <span className="font-semibold">{formatNumber(file.upns.length)}</span> unique UPNs
                {file.invalid > 0 && <span className="text-ink-3"> · {file.invalid} lines skipped</span>}
              </span>
            </p>
            <ul className="max-h-40 overflow-auto px-3 py-2 text-sm text-ink-2">
              {file.upns.slice(0, 50).map((u) => (
                <li key={u} className="truncate py-0.5">
                  {u}
                </li>
              ))}
              {file.upns.length > 50 && <li className="py-0.5 text-ink-3">…and {formatNumber(file.upns.length - 50)} more</li>}
            </ul>
          </div>
          <Field label='Type "DELETE" to confirm' value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </>
      )}
    </FormDialog>
  )
}
