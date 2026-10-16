import { CircleAlert, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api/client'
import { Button, IconButton } from './Button'

// Ported from the Family Photos admin (src/components/admin/ui.tsx).

/** Page title row of every screen. */
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && <div className="mt-1.5 max-w-[72ch] text-ink-2">{description}</div>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  )
}

export const errorText = (e: unknown, fallback = 'Something went wrong. Try again in a moment.') =>
  e instanceof ApiError ? e.message : e instanceof Error && e.message ? e.message : fallback

/** Inline error near the thing that failed. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-[var(--radius-paper)] border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
      <CircleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden /> <span>{children}</span>
    </p>
  )
}

/** Pill showing a state. Tone is meaning, not decoration. */
export function Tag({ tone = 'neutral', children }: { tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'coral'; children: ReactNode }) {
  const tones = {
    neutral: 'border-line text-ink-2',
    ok: 'border-ok/40 text-ok',
    warn: 'border-warn/50 text-warn',
    danger: 'border-danger/40 text-danger',
    coral: 'border-transparent bg-coral-wash text-coral-ink',
  }
  return <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>{children}</span>
}

/** Native <dialog>: traps focus, closes on Esc and backdrop click, returns focus to its opener. */
export function Modal({
  open,
  onClose,
  title,
  description,
  aside,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  /** Shown in the title row next to Close, e.g. a status badge. */
  aside?: ReactNode
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null
      d.showModal()
    } else if (!open && d.open) {
      d.close()
      opener.current?.focus?.()
    }
  }, [open])

  // xl is for tools that are almost a page (e.g. License usage): wide, and tall even when empty
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-7xl min-h-[min(46rem,calc(100dvh-2rem))]' }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.target === e.currentTarget) onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`paper-shadow m-auto w-[calc(100%-2rem)] overflow-hidden ${widths[size]} max-h-[calc(100dvh-2rem)] rounded-[var(--radius-paper)] border border-line bg-paper p-0 text-ink backdrop:bg-[oklch(0.2_0.04_262/0.55)] backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-bold">
                {title}
              </h2>
              {description && <div className="mt-1 text-sm text-ink-2">{description}</div>}
            </div>
            {aside && <div className="ml-auto flex shrink-0 items-center gap-2 self-center">{aside}</div>}
            <IconButton label="Close" onClick={onClose} className="-mr-2 shrink-0">
              <X className="size-5" aria-hidden />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}

/** Confirmation for tenant-wide or destructive changes. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  danger = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<unknown> | void
  title: string
  body: ReactNode
  confirmLabel: string
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {open && <ConfirmBody onClose={onClose} onConfirm={onConfirm} body={body} confirmLabel={confirmLabel} danger={danger} />}
    </Modal>
  )
}

function ConfirmBody({
  onClose,
  onConfirm,
  body,
  confirmLabel,
  danger,
}: {
  onClose: () => void
  onConfirm: () => Promise<unknown> | void
  body: ReactNode
  confirmLabel: string
  danger: boolean
}) {
  const [busy, setBusy] = useState(false)
  async function go() {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // The failure is already shown as an error toast (see MutationCache in main.tsx);
      // the dialog stays open so the operator can retry or cancel.
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-ink-2">{body}</div>
      <div className="mt-1 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} autoFocus>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={go} loading={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </div>
  )
}

const dateTime = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const numberFmt = new Intl.NumberFormat('en-US')

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const formatNumber = (n: number) => numberFmt.format(n)

const dateOnly = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
export const formatDate = (iso: string) => dateOnly.format(new Date(iso))
