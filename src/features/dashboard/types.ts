/** Counts the backend could not read come back as null and render as "Not reported". */
export interface DashboardSummary {
  tenant: {
    id: string
    displayName: string
    domain: string
  }
  users: { total: number | null; addedLast7Days: number | null }
  licenses: { used: number | null; available: number | null }
  groups: { total: number | null }
  devices: { managed: number | null; nonCompliant: number | null }
}

export type UserStatus = 'active' | 'blocked' | 'pending'

export interface RecentUser {
  id: string
  displayName: string
  upn: string
  status: UserStatus
  createdAt: string
}

/** Tenant-level switches. `null` means the backend could not determine the value. */
export interface SyncStatus {
  /** Entra `onPremisesSyncEnabled` (tenant level, not the per-user Sync badge). */
  directorySync: boolean | null
  /** Entra `features.passwordSyncEnabled`. */
  passwordSync: boolean | null
  /** Whether the on-premises AD setup helper is available for this tenant. */
  onPremHelper: boolean | null
}

export type CheckState = 'pass' | 'fail' | 'unknown'

export interface ProtectionCheck {
  id: 'directorySync' | 'passwordSync' | 'passwordWritebackOff' | 'userSynced' | 'globalAdminRole'
  state: CheckState
  detail?: string
}

export interface ProtectionDiagnosis {
  upn: string
  protected: boolean
  passwordWriteback: boolean | null
  checks: ProtectionCheck[]
}

/** Readiness of the on-premises AD helper host. */
export type HelperCheckState = 'ok' | 'missing' | 'unknown'

export interface AdHelperStatus {
  /** Fails closed: false unless the backend sets MAILCREATE_AD_HELPER_ENABLED=1. */
  enabled: boolean
  checks: {
    adModule: HelperCheckState
    adLoaded: HelperCheckState
    domain: HelperCheckState
    adSync: HelperCheckState
    entraConnect: HelperCheckState
  }
  /** AD domain FQDN detected on the host, used to prefill the form. */
  domainFqdn: string | null
}

export interface AdAccountOptions {
  domainFqdn: string
  upnSuffix: string
  ouDn: string
  samAccountName: string
  passwordNeverExpires: boolean
  cannotChangePassword: boolean
}

export interface SyncedAdminResult {
  outcome: 'created' | 'matched'
  distinguishedName: string
  message: string
}
