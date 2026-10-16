import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { ErrorState, LoadingState } from '@/components/ui/StateViews'
import { useState } from 'react'
import { useUserDetail } from '../api'
import { FormDialog } from '../dialogs/FormDialog'
import type { UserRow } from '../types'
import { GroupsTab } from './GroupsTab'
import { LicenseTab } from './LicenseTab'
import { ProfileTab, useProfileForm } from './ProfileTab'
import { RolesTab } from './RolesTab'
import { SecurityTab } from './SecurityTab'

type Tab = 'profile' | 'security' | 'license' | 'groups' | 'roles'

const tabs: { value: Tab; label: string }[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'security', label: 'Security' },
  { value: 'license', label: 'License' },
  { value: 'groups', label: 'Groups' },
  { value: 'roles', label: 'Admin roles' },
]

/**
 * Edit one user. Each tab saves on its own (profile, password, licenses,
 * groups, roles are separate Graph calls), so the footer only carries
 * "Save profile" on the Profile tab.
 */
export function EditUserDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const detail = useUserDetail(user.id)
  const [tab, setTab] = useState<Tab>('profile')
  const profile = useProfileForm(detail.data, onClose)

  const close = (
    <Button type="button" variant="secondary" onClick={onClose}>
      Close
    </Button>
  )

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Edit ${detail.data?.displayName ?? user.displayName}`}
      description={detail.data?.upn ?? user.upn}
      submitLabel="Save profile"
      onSubmit={profile.submit}
      busy={profile.busy}
      size="lg"
      footer={
        tab === 'profile' && detail.data ? (
          <>
            {close}
            <Button type="submit" loading={profile.busy} disabled={!profile.dirty}>
              Save profile
            </Button>
          </>
        ) : (
          close
        )
      }
    >
      <Tabs label="Edit sections" value={tab} onChange={setTab} tabs={tabs} className="-mx-6 -mt-5 px-4" />

      {detail.isPending ? (
        <LoadingState label="Loading user…" />
      ) : detail.isError ? (
        <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
      ) : (
        // a steady height so the dialog does not jump while switching tabs
        <div role="tabpanel" aria-label={tabs.find((t) => t.value === tab)?.label} className="min-h-[23rem]">
          {tab === 'profile' && <ProfileTab form={profile} />}
          {tab === 'security' && <SecurityTab user={detail.data} />}
          {tab === 'license' && <LicenseTab user={detail.data} />}
          {tab === 'groups' && <GroupsTab user={detail.data} />}
          {tab === 'roles' && <RolesTab user={detail.data} />}
        </div>
      )}
    </FormDialog>
  )
}
