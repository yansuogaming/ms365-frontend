import {
  Ban, KeyRound, Languages, LogOut, PencilLine, RotateCcwKey, ShieldCheck, Ticket, Trash2, Type, Unlock, type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ScrollRow } from '@/components/ui/ScrollRow'
import { formatNumber } from '@/components/ui/admin'

export type BulkAction =
  | 'edit' | 'rename' | 'twoFactor' | 'block' | 'unblock' | 'tap' | 'revokeSessions' | 'resetPassword' | 'forcePasswordChange' | 'language' | 'delete'

interface BulkBarProps {
  count: number
  onAction: (a: BulkAction) => void
}

const actions: { key: BulkAction; label: string; icon: LucideIcon; hint: string; danger?: boolean }[] = [
  { key: 'edit', label: 'Edit', icon: PencilLine, hint: 'Roles and shared fields' },
  { key: 'rename', label: 'Rename', icon: Type, hint: 'Display name and username' },
  { key: 'twoFactor', label: '2FA', icon: ShieldCheck, hint: 'TAP, SMS phone or recovery email' },
  { key: 'block', label: 'Block', icon: Ban, hint: 'Block sign-in' },
  { key: 'unblock', label: 'Unblock', icon: Unlock, hint: 'Allow sign-in' },
  { key: 'tap', label: 'TAP', icon: Ticket, hint: 'Temporary Access Pass' },
  { key: 'revokeSessions', label: 'Force re-auth', icon: LogOut, hint: 'Sign out on every device' },
  { key: 'resetPassword', label: 'Reset pwd', icon: KeyRound, hint: 'Generate a new password' },
  { key: 'forcePasswordChange', label: 'Force chg pwd', icon: RotateCcwKey, hint: 'New password at next sign-in' },
  { key: 'language', label: 'Language', icon: Languages, hint: 'Preferred language' },
  { key: 'delete', label: 'Delete', icon: Trash2, hint: 'Restorable for 30 days', danger: true },
]

/**
 * Slides open under the filters once users are selected, and closes when the
 * selection is cleared. One row everywhere: the actions scroll sideways when
 * they do not fit, with the count pinned on the left. Deselect from the table checkboxes.
 */
export function BulkBar({ count, onAction }: BulkBarProps) {
  const reduce = useReducedMotion()

  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
        <motion.div
          key="bulk-bar"
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div role="toolbar" aria-label="Actions for selected users" className="flex items-center gap-2 border-b border-line bg-coral-wash/60 py-2 pr-4 pl-4 sm:gap-3 sm:pr-6 sm:pl-6">
            <p className="flex shrink-0 items-center gap-2 text-sm font-semibold whitespace-nowrap" aria-live="polite">
              <span className="tabular grid h-6 min-w-6 place-items-center rounded-full bg-coral px-1.5 text-xs text-on-coral">{formatNumber(count)}</span>
              <span className="hidden sm:inline">selected</span>
            </p>

            <span className="h-5 w-px shrink-0 bg-line" aria-hidden />

            <ScrollRow className="flex-1" label="Bulk actions">
              {actions.map(({ key, label, icon: Icon, hint, danger }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAction(key)}
                  title={hint}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold whitespace-nowrap transition-colors sm:px-3 ${
                    danger ? 'text-danger hover:bg-danger-wash' : 'text-ink hover:bg-paper'
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              ))}
            </ScrollRow>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
