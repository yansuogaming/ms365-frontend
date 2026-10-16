import { useState } from 'react'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { notify } from '@/components/ui/Toaster'
import { countryOptions } from '@/lib/countries'
import { useOrgProfile, usersApi, useUserMutation } from '../api'
import type { UserDetail, UserEdit } from '../types'

interface Profile {
  username: string
  domain: string
  displayName: string
  jobTitle: string
  department: string
  mobilePhone: string
  usageLocation: string
  accountEnabled: boolean
}

const LOCAL = /^[a-z0-9][a-z0-9._'-]{0,63}$/i

function fromUser(u: UserDetail): Profile {
  const at = u.upn.lastIndexOf('@')
  return {
    username: u.upn.slice(0, at),
    domain: u.upn.slice(at + 1),
    displayName: u.displayName,
    jobTitle: u.jobTitle ?? '',
    department: u.department ?? '',
    mobilePhone: u.mobilePhone ?? '',
    usageLocation: u.usageLocation || 'US',
    accountEnabled: u.accountEnabled ?? u.status === 'active',
  }
}

/** Profile tab state lives in the dialog so its footer can show "Save profile". */
export function useProfileForm(user: UserDetail | undefined, onSaved: () => void) {
  const [form, setForm] = useState<Profile | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  if (user && loadedFor !== user.id) {
    setLoadedFor(user.id)
    setForm(fromUser(user))
  }
  const [error, setError] = useState<Partial<Record<keyof Profile, string>>>({})

  const original = user ? fromUser(user) : null
  const changed = form && original ? (Object.keys(form) as (keyof Profile)[]).filter((k) => form[k] !== original[k]) : []

  const save = useUserMutation(
    async (p: Profile) => {
      if (!user || !original) return
      const upnChanged = p.username.trim().toLowerCase() !== original.username.toLowerCase() || p.domain !== original.domain
      if (upnChanged) await usersApi.rename(user.id, { upn: `${p.username.trim().toLowerCase()}@${p.domain}` })
      const fields: Partial<UserEdit> = {}
      if (p.displayName.trim() !== original.displayName) fields.displayName = p.displayName.trim()
      if (p.jobTitle.trim() !== original.jobTitle) fields.jobTitle = p.jobTitle.trim()
      if (p.department.trim() !== original.department) fields.department = p.department.trim()
      if (p.mobilePhone.trim() !== original.mobilePhone) fields.mobilePhone = p.mobilePhone.trim()
      if (p.usageLocation !== original.usageLocation) fields.usageLocation = p.usageLocation
      if (p.accountEnabled !== original.accountEnabled) fields.accountEnabled = p.accountEnabled
      if (Object.keys(fields).length) await usersApi.update(user.id, fields)
    },
    () => {
      notify.success('Profile saved')
      onSaved()
    },
  )

  function submit() {
    if (!form) return
    const e: typeof error = {}
    if (!LOCAL.test(form.username.trim())) e.username = 'Letters, numbers and . _ - only.'
    if (!form.displayName.trim()) e.displayName = 'A display name is required.'
    if (form.mobilePhone.trim() && !/^\+?[0-9][0-9 ().-]{6,19}$/.test(form.mobilePhone.trim())) e.mobilePhone = 'Use the international format, e.g. +84 912 345 678.'
    setError(e)
    if (!Object.keys(e).length) save.mutate(form)
  }

  return { form, setForm, error, submit, busy: save.isPending, dirty: changed.length > 0 }
}

export function ProfileTab({ form: f }: { form: ReturnType<typeof useProfileForm> }) {
  const domains = useOrgProfile(true).data?.domains.filter((d) => d.isVerified).map((d) => d.name) ?? []
  if (!f.form) return null
  const p = f.form
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => f.setForm({ ...p, [k]: v })
  const domainOptions = (domains.includes(p.domain) ? domains : [p.domain, ...domains]).map((d) => ({ value: d, label: d }))

  return (
    <div className="grid gap-4 pt-5 sm:grid-cols-2">
      <Field label="Username" value={p.username} onChange={(e) => set('username', e.target.value)} error={f.error.username} autoComplete="off" spellCheck={false} />
      <Select label="Domain" showLabel variant="field" value={p.domain} onChange={(v) => set('domain', v)} options={domainOptions} />
      <Field label="Display name" value={p.displayName} onChange={(e) => set('displayName', e.target.value)} error={f.error.displayName} autoComplete="off" />
      <Field label="Job title" value={p.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} autoComplete="off" />
      <Field label="Department" value={p.department} onChange={(e) => set('department', e.target.value)} autoComplete="off" />
      <Field label="Mobile phone" type="tel" value={p.mobilePhone} onChange={(e) => set('mobilePhone', e.target.value)} placeholder="+84 912 345 678" error={f.error.mobilePhone} autoComplete="off" />
      <Select label="Usage location" showLabel variant="field" value={p.usageLocation} onChange={(v) => set('usageLocation', v)} options={countryOptions} />
      <Select
        label="Account state"
        showLabel
        variant="field"
        value={p.accountEnabled ? 'enabled' : 'disabled'}
        onChange={(v) => set('accountEnabled', v === 'enabled')}
        options={[
          { value: 'enabled', label: 'Enabled' },
          { value: 'disabled', label: 'Disabled (sign-in blocked)' },
        ]}
      />
    </div>
  )
}
