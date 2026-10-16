import type { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/admin'

interface FormDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  submitLabel: string
  onSubmit: () => void
  busy?: boolean
  danger?: boolean
  /** Disable submit (invalid form). */
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  /** Replaces the footer, e.g. a single "Done" after a result is shown. */
  footer?: ReactNode
}

/** Modal + form + Cancel/Submit footer, shared by every user action that needs input. */
export function FormDialog({ open, onClose, title, description, submitLabel, onSubmit, busy, danger, disabled, size = 'sm', children, footer }: FormDialogProps) {
  function submit(e: FormEvent) {
    e.preventDefault()
    if (!busy && !disabled) onSubmit()
  }
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size={size}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {children}
        {/* sticks to the bottom of the dialog while a long form scrolls */}
        <div className="sticky -bottom-5 z-10 -mx-6 -mb-5 flex flex-wrap justify-end gap-2 border-t border-line bg-paper px-6 py-4">
          {footer ?? (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant={danger ? 'danger' : 'primary'} loading={busy} disabled={disabled}>
                {submitLabel}
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  )
}

/** "Megan Bowen" for one user, "3 users" for many. */
export const who = (labels: string[]) => (labels.length === 1 ? labels[0] : `${labels.length} users`)
