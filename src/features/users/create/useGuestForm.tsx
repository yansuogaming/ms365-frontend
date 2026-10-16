import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Field } from '@/components/ui/Field'
import { FormSection } from '@/components/ui/FormSection'
import { notify } from '@/components/ui/Toaster'
import { usersApi, useUserMutation } from '../api'
import type { InviteGuestRequest, InviteGuestResult } from '../types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Guest tab of Create user: B2B invitation. */
export function useGuestForm(onInvited: () => void) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [error, setError] = useState<string>()
  const [result, setResult] = useState<InviteGuestResult | null>(null)
  const [copied, setCopied] = useState(false)

  const invite = useUserMutation(
    (body: InviteGuestRequest) => usersApi.inviteGuest(body),
    (r, body) => {
      setResult(r)
      notify.success(`Invited ${body.email}`, { description: body.sendInvitationEmail ? 'An invitation email is on its way.' : 'Share the invitation link with the guest.' })
      onInvited()
    },
  )

  function submit() {
    if (!EMAIL.test(email.trim())) return setError('Enter the guest’s email address.')
    setError(undefined)
    invite.mutate({ email: email.trim().toLowerCase(), displayName: displayName.trim() || undefined, sendInvitationEmail: sendEmail })
  }

  function reset() {
    setResult(null)
    setEmail('')
    setDisplayName('')
    invite.reset()
  }

  async function copyLink() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.inviteRedeemUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      notify.error('Couldn’t copy to the clipboard')
    }
  }

  const view = result ? (
    <div className="flex flex-col gap-4">
      <p className="text-ink-2">
        <span className="font-semibold text-ink">{result.user.upn}</span> was invited and shows in Users as pending until they accept.
      </p>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Invitation link</span>
        <div className="flex gap-2">
          <input readOnly value={result.inviteRedeemUrl} onFocus={(e) => e.target.select()} className="h-12 min-w-0 flex-1 rounded-[var(--radius-paper)] border border-line bg-paper-2 px-4 text-sm text-ink-2 outline-none" />
          <Button type="button" variant="secondary" className="h-12" onClick={copyLink}>
            {copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <FormSection title="Guest identity">
      <div className="flex flex-col gap-4">
        <Field label="External email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@partner.com" error={error} autoComplete="off" />
        <Field label="Display name (optional)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Partner" autoComplete="off" />
        <Checkbox checked={sendEmail} onChange={setSendEmail} label="Send invitation email to the guest" />
        <p className="text-sm text-ink-3">
          Sends a B2B invitation: the guest gets an email and redeems it. Needs the <b className="font-semibold text-ink-2">User.Invite.All</b> permission. The guest appears in Users as
          PendingAcceptance after the invite.
        </p>
      </div>
    </FormSection>
  )

  return { view, submit, busy: invite.isPending, created: Boolean(result), reset }
}
