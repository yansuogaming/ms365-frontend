import { KeyRound, RefreshCw, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Tag } from '@/components/ui/admin'
import { Panel } from '@/components/ui/Panel'
import { ErrorState } from '@/components/ui/StateViews'
import { useSetSync, useSyncStatus } from '../api'

function stateTag(on: boolean | null) {
  if (on === null) return <Tag>Unknown</Tag>
  return on ? <Tag tone="ok">Enabled</Tag> : <Tag tone="warn">Disabled</Tag>
}

interface RowProps {
  kind: 'directory' | 'password'
  icon: LucideIcon
  title: string
  description: string
  value: boolean | null | undefined
}

function SyncRow({ kind, icon: Icon, title, description, value }: RowProps) {
  const mutation = useSetSync(kind)
  const [confirm, setConfirm] = useState(false)
  const next = !value

  return (
    <li className="flex items-start gap-4 px-6 py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-2">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {title}
          {value === undefined ? <span className="h-6 w-20 animate-pulse rounded-full bg-paper-3" /> : stateTag(value)}
        </p>
        <p className="mt-1 text-sm text-ink-2">{description}</p>
      </div>
      <Button
        size="sm"
        variant={value ? 'secondary' : 'primary'}
        disabled={value === undefined || value === null}
        title={value === null ? 'Current state is unknown' : undefined}
        onClick={() => setConfirm(true)}
        className="shrink-0"
      >
        {value ? 'Turn off' : 'Turn on'}
      </Button>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => mutation.mutateAsync(next)}
        title={`${next ? 'Turn on' : 'Turn off'} ${title.toLowerCase()}?`}
        body={`This changes a tenant-wide setting for every user in this tenant. It can take a few minutes to apply in Microsoft Entra.`}
        confirmLabel={next ? 'Turn on' : 'Turn off'}
        danger={!next}
      />
    </li>
  )
}

export function DirectorySync() {
  const { data, isError, error, refetch } = useSyncStatus()

  return (
    <Panel title="Directory sync">
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <ul className="divide-y divide-line">
          <SyncRow
            kind="directory"
            icon={RefreshCw}
            title="Tenant directory sync"
            description="Entra onPremisesSyncEnabled. A tenant-level setting, separate from each user's Sync badge."
            value={data?.directorySync}
          />
          <SyncRow
            kind="password"
            icon={KeyRound}
            title="Password sync"
            description="Entra features.passwordSyncEnabled. Syncs passwords from the on-premises directory."
            value={data?.passwordSync}
          />
        </ul>
      )}
    </Panel>
  )
}
