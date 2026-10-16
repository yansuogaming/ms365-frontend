import { useState } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Field } from '@/components/ui/Field'
import { FormDialog } from '@/components/ui/FormDialog'
import { InfoTip } from '@/components/ui/InfoTip'
import { Select } from '@/components/ui/Select'
import { notify } from '@/components/ui/Toaster'
import { groupsApi, useGroupMutation } from '../api'
import type { CreatableKind, GroupRow } from '../types'

/** Same idea as Entra: letters and digits from the name, no spaces. */
export const nicknameFrom = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 64)

const NICKNAME = /^[A-Za-z0-9._-]{1,64}$/

export function CreateGroupDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (g: GroupRow) => void }) {
  const [kind, setKind] = useState<CreatableKind>('Security')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nickname, setNickname] = useState('')
  const [roleAssignable, setRoleAssignable] = useState(false)
  const [rule, setRule] = useState('')
  const [touched, setTouched] = useState(false)

  const autoNick = nicknameFrom(name)
  const nickError = nickname.trim() && !NICKNAME.test(nickname.trim()) ? 'Letters, numbers and . _ - only, no spaces.' : undefined
  const nameError = touched && !name.trim() ? 'Enter a group name.' : undefined

  const create = useGroupMutation(
    () =>
      groupsApi.create({
        kind,
        displayName: name.trim(),
        ...(description.trim() && { description: description.trim() }),
        ...(nickname.trim() && { mailNickname: nickname.trim() }),
        isAssignableToRole: roleAssignable,
        // role-assignable groups cannot be dynamic
        ...(rule.trim() && !roleAssignable && { membershipRule: rule.trim() }),
      }),
    (g) => {
      notify.success(`Created ${g.displayName}`)
      onCreated(g)
    },
  )

  return (
    <FormDialog
      open
      onClose={onClose}
      title="New group"
      submitLabel="Create group"
      onSubmit={() => {
        setTouched(true)
        if (name.trim() && !nickError) create.mutate(undefined)
      }}
      busy={create.isPending}
      size="md"
    >
      <Select
        label="Group type"
        showLabel
        variant="field"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'Security', label: 'Security', hint: 'Access and licenses' },
          { value: 'Microsoft 365', label: 'Microsoft 365', hint: 'Mailbox, files, Teams' },
        ]}
      />
      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Team" error={nameError} autoComplete="off" />
      <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" autoComplete="off" />
      <Field
        label="Mail nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder={autoNick ? `${autoNick} (from the name)` : 'auto from name'}
        error={nickError}
        autoComplete="off"
        spellCheck={false}
      />
      <Checkbox
        checked={roleAssignable}
        onChange={setRoleAssignable}
        label={
          <span className="inline-flex items-center gap-1.5">
            Microsoft Entra roles can be assigned to this group
            <InfoTip label="About role-assignable groups">Only set this when you will give the group an admin role. It cannot be changed after the group is created, and it needs Entra ID P1.</InfoTip>
          </span>
        }
      />
      <Field
        label="Dynamic membership rule (optional)"
        value={rule}
        onChange={(e) => setRule(e.target.value)}
        placeholder='e.g. user.department -eq "Sales"'
        hint="With a rule, members are added and removed automatically and cannot be managed by hand. Needs Entra ID P1."
        autoComplete="off"
        spellCheck={false}
        disabled={roleAssignable}
      />
    </FormDialog>
  )
}
