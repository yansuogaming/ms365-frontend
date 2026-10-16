import { Checkbox } from '@/components/ui/Checkbox'
import { Select } from '@/components/ui/Select'
import { useState } from 'react'
import { reportBulk, usersApi, useUserMutation } from '../api'
import type { UserRow } from '../types'
import { FormDialog, who } from './FormDialog'

/** Languages offered for users and the organization (Microsoft 365 display languages), in their own names. */
export const languages = [
  ['en-US', 'English (United States)'],
  ['en-GB', 'English (United Kingdom)'],
  ['vi-VN', 'Tiếng Việt'],
  ['zh-CN', '中文 (简体)'],
  ['zh-TW', '中文 (繁體)'],
  ['ja-JP', '日本語'],
  ['ko-KR', '한국어'],
  ['th-TH', 'ไทย'],
  ['id-ID', 'Bahasa Indonesia'],
  ['ms-MY', 'Bahasa Melayu'],
  ['hi-IN', 'हिन्दी'],
  ['fr-FR', 'Français'],
  ['de-DE', 'Deutsch'],
  ['es-ES', 'Español'],
  ['it-IT', 'Italiano'],
  ['pt-PT', 'Português (Portugal)'],
  ['pt-BR', 'Português (Brasil)'],
  ['nl-NL', 'Nederlands'],
  ['sv-SE', 'Svenska'],
  ['da-DK', 'Dansk'],
  ['nb-NO', 'Norsk bokmål'],
  ['fi-FI', 'Suomi'],
  ['pl-PL', 'Polski'],
  ['cs-CZ', 'Čeština'],
  ['ru-RU', 'Русский'],
  ['tr-TR', 'Türkçe'],
  ['ar-SA', 'العربية'],
  ['he-IL', 'עברית'],
] as const

interface Props {
  users: UserRow[]
  onClose: () => void
  onDone: () => void
}

export function LanguageDialog({ users, onClose, onDone }: Props) {
  const [language, setLanguage] = useState('en-US')
  const [includeMailbox, setIncludeMailbox] = useState(true)
  const n = users.length
  const run = useUserMutation(
    () => usersApi.setLanguage(users.map((u) => u.id), language, includeMailbox),
    (r) => {
      reportBulk('Changed the language for', r)
      onDone()
    },
  )
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Change language — ${n} user${n === 1 ? '' : 's'}`}
      description={n === 1 ? users[0].upn : who(users.map((u) => u.displayName))}
      submitLabel="Apply"
      onSubmit={() => run.mutate(undefined)}
      busy={run.isPending}
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Language (preferredLanguage)"
          showLabel
          variant="field"
          value={language}
          onChange={setLanguage}
          options={languages.map(([code, name]) => ({ value: code, label: `${name} (${code})` }))}
        />
        <Checkbox checked={includeMailbox} onChange={setIncludeMailbox} label="Also change the mailbox language (Outlook)" />
        <p className="text-sm text-ink-3">
          <b className="font-semibold text-ink-2">preferredLanguage</b> sets the language of the Microsoft 365 portal and apps for the user. The <b className="font-semibold text-ink-2">mailbox language</b> sets Outlook, including the names of folders such as Inbox and Sent. The user may need to sign in again to see the change.
        </p>
      </div>
    </FormDialog>
  )
}
