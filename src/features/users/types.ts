export type AccountStatus = 'active' | 'blocked'

export interface UserLicense {
  skuId: string
  name: string
}

export interface UserRow {
  id: string
  displayName: string
  upn: string
  status: AccountStatus
  licenses: UserLicense[]
  /** Directory roles held, e.g. "Global Administrator". Empty for regular users. */
  roles: string[]
  createdAt: string
  /** null when OneDrive is not provisioned or usage could not be read. */
  oneDrive: { usedBytes: number; quotaBytes: number } | null
}

export type UserSort = `${'createdAt' | 'displayName' | 'oneDrive'}:${'asc' | 'desc'}`

export interface UserListQuery {
  page: number
  pageSize: number
  search: string
  status: 'all' | AccountStatus
  /** skuId; '' any; 'has' at least one license; 'none' unlicensed. */
  license: string
  /** Role name, '' for anyone, 'any' for users holding at least one admin role. */
  role: string
  sort: UserSort
}

/** A license plan and how much of it is in use (License usage dialog, license filter). */
export interface SkuUsage {
  skuId: string
  name: string
  consumed: number
  enabled: number
}

export interface DirectoryRole {
  name: string
  memberCount: number
}

export interface OrgProfile {
  displayName: string
  tenantId: string
  country: string | null
  createdAt: string | null
  technicalContacts: string[]
  /** Organization-wide preferredLanguage, e.g. "en-GB". */
  preferredLanguage: string | null
  domains: { name: string; isDefault: boolean; isVerified: boolean }[]
}


export interface CredentialResult {
  upn: string
  /** Shown once to the operator; never stored by the UI. */
  secret?: string
  expiresAt?: string
  error?: string
}

export interface UserEdit {
  displayName: string
  givenName: string
  surname: string
  jobTitle: string
  department: string
  usageLocation: string
  mobilePhone: string
  /** false = sign-in blocked ("Disabled" in the account state menu). */
  accountEnabled: boolean
}

export type UserDetail = UserRow & UserEdit & {
  /** SSPR recovery email, null when not set. */
  recoveryEmail: string | null
}

/** A soft-deleted account, restorable for 30 days after `deletedAt`. */
export interface DeletedUser {
  id: string
  displayName: string
  upn: string
  deletedAt: string
}

/** Target of a restore/purge: specific ids, or everything matching `search`. */
export type DeletedTarget = { ids: string[] } | { all: true; search: string }

/** A directory role that can be assigned (Global Administrator, User Administrator…). */
export interface RoleDefinition {
  id: string
  name: string
}

/** Shared fields the bulk editor can set; an empty string clears the field. */
export type SharedField = 'usageLocation' | 'jobTitle' | 'department'

export interface BulkEditRequest {
  ids: string[]
  /** Assign or remove these roles on every selected user. */
  roles?: { mode: 'assign' | 'remove'; roleIds: string[] }
  /** Remove every directory role the selected users currently hold. */
  removeAllRoles?: boolean
  fields?: Partial<Record<SharedField, string>>
}

/** One user's new names, computed in the UI so the preview equals what is sent. */
export interface RenameChange {
  id: string
  displayName?: string
  /** Part before "@". */
  upnLocal?: string
  /** New verified domain; omitted keeps the current one. */
  domain?: string
}

export type TwoFactorMethod = 'tap' | 'phone' | 'email'

/** License usage scan (Tools → License usage). */
export type UsagePeriod = 'D7' | 'D30' | 'D90' | 'D180'
export type UsageStatus = 'active' | 'inactive' | 'auditLimited' | 'neverUsed' | 'noLicense'

export interface UsageScanRequest {
  period: UsagePeriod
  /** A licensed user with no activity within this many days counts as inactive. */
  activeDays: number
  maxUsers: number
  /** Only these UPNs ("Scan target"); omitted for a full scan. */
  targets?: string[]
}

export interface UsageRow {
  id: string
  displayName: string
  upn: string
  status: UsageStatus
  licenses: string[]
  /** Last activity seen in any signal; null when never. */
  lastSeen: string | null
  /** Where the last activity came from, e.g. "Sign-in", "Exchange", "Teams". */
  signal: string | null
  /** Device or client app of that activity, e.g. "Windows · Outlook". */
  device: string | null
}

export interface UsageSummary {
  licensed: number
  active: number
  inactive: number
  auditLimited: number
  neverUsed: number
  noLicense: number
  scanned: number
}

export interface UsageScanJob {
  id: string
  state: 'running' | 'done' | 'failed'
  progress: { scanned: number; total: number }
  summary: UsageSummary
  rows: UsageRow[]
  error?: string
}

export interface OrgUpdate {
  technicalContact: string
  preferredLanguage: string
  /** Also set preferredLanguage on every user in the tenant (not reverted automatically). */
  applyToAllUsers: boolean
  /** With applyToAllUsers: also change each mailbox's Outlook language. */
  includeMailbox: boolean
}

/** New member account (Create user → Member). */
export interface CreateUserRequest {
  displayName: string
  upnLocal: string
  domain: string
  /** Generated in the browser; shown once, never stored by the UI. */
  password: string
  forceChangePassword: boolean
  usageLocation: string
  skuIds: string[]
  groupIds: string[]
  roleIds: string[]
  /** If set, the backend emails the sign-in details to this address. */
  sendCredentialsTo?: string
}

/** B2B guest invitation (Create user → Guest). */
export interface InviteGuestRequest {
  email: string
  displayName?: string
  sendInvitationEmail: boolean
}

export interface InviteGuestResult {
  user: UserRow
  /** Link the guest opens to accept; useful when no email is sent. */
  inviteRedeemUrl: string
}

export interface GroupOption {
  id: string
  displayName: string
}

/** Add/remove sets for one user's licenses or groups. */
export interface MembershipChange {
  add: string[]
  remove: string[]
}
