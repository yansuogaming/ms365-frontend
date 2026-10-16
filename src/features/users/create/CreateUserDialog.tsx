import { Mail, Send, UserPlus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { FormDialog } from '../dialogs/FormDialog'
import { useGuestForm } from './useGuestForm'
import { useMemberForm } from './useMemberForm'

type Tab = 'member' | 'guest'

/**
 * Create user: a member account (licenses, groups and roles in one step) or a
 * guest invitation. Both tabs keep their input while switching.
 */
export function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('member')
  const member = useMemberForm(() => {})
  const guest = useGuestForm(() => {})
  const form = tab === 'member' ? member : guest

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Create user"
      description="Add a single account: licenses, groups and admin roles in one step."
      submitLabel={tab === 'member' ? 'Create user' : 'Send invite'}
      onSubmit={form.submit}
      busy={form.busy}
      size="lg"
      footer={
        form.created ? (
          <>
            <Button type="button" variant="secondary" onClick={form.reset}>
              {tab === 'member' ? 'Create another' : 'Invite another'}
            </Button>
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={form.busy}>
              {!form.busy && (tab === 'member' ? <UserPlus className="size-4" aria-hidden /> : <Send className="size-4" aria-hidden />)}
              {tab === 'member' ? 'Create user' : 'Send invite'}
            </Button>
          </>
        )
      }
    >
      <Segmented
        variant="tabs"
        label="Account type"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'member', label: 'Member', icon: <UserRound className="size-4" aria-hidden /> },
          { value: 'guest', label: 'Guest (invite external)', icon: <Mail className="size-4" aria-hidden /> },
        ]}
      />
      {form.view}
    </FormDialog>
  )
}
