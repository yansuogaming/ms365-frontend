import { Select } from '@/components/ui/Select'
import { useState } from 'react'
import { reportBulk, usersApi, useUserMutation } from '../api'
import type { UserRow } from '../types'
import { FormDialog, who } from './FormDialog'

/** Languages offered for users and the organization. */
export const languages = [
  ['en-US', 'English (United States)'],
  ['en-GB', 'English (United Kingdom)'],
  ['vi-VN', 'Tiếng Việt'],
  ['id-ID', 'Bahasa Indonesia'],
  ['th-TH', 'ไทย'],
  ['ms-MY', 'Bahasa Melayu'],
  ['zh-CN', '中文 (简体)'],
  ['ja-JP', '日本語'],
  ['ko-KR', '한국어'],
  ['fr-FR', 'Français'],
  ['de-DE', 'Deutsch'],
  ['es-ES', 'Español'],
] as const

interface Props {
  users: UserRow[]
  onClose: () => void
  onDone: () => void
}

export function LanguageDialog({ users, onClose, onDone }: Props) {
  const [language, setLanguage] = useState('en-US')
  const run = useUserMutation(
    () => usersApi.setLanguage(users.map((u) => u.id), language),
    (r) => {
      reportBulk('Updated language for', r)
      onDone()
    },
  )
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Set language for ${who(users.map((u) => u.displayName))}`}
      description="Sets the preferred language used by Microsoft 365 apps and emails."
      submitLabel="Set language"
      onSubmit={() => run.mutate(undefined)}
      busy={run.isPending}
    >
      <Select
        label="Language"
        showLabel
        variant="field"
        value={language}
        onChange={setLanguage}
        options={languages.map(([code, name]) => ({ value: code, label: name, hint: code }))}
      />
    </FormDialog>
  )
}
