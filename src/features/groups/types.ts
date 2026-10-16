export type GroupKind = 'Microsoft 365' | 'Security' | 'Mail-enabled security' | 'Distribution'

export interface GroupRow {
  id: string
  displayName: string
  description: string | null
  kind: GroupKind
  mail: string | null
  /** Dynamic groups compute their members from a rule; members cannot be added by hand. */
  membership: 'Assigned' | 'Dynamic'
  createdAt: string
}

export type GroupSort = `${'displayName' | 'createdAt'}:${'asc' | 'desc'}`

export interface GroupListQuery {
  page: number
  pageSize: number
  search: string
  /** '' = any type */
  kind: '' | GroupKind
  sort: GroupSort
}

export interface GroupMember {
  id: string
  displayName: string
  /** UPN or mail; empty for devices and service principals. */
  upn: string | null
  type: 'user' | 'group' | 'device' | 'servicePrincipal'
}

export interface GroupDetail extends GroupRow {
  mailNickname: string
  isAssignableToRole: boolean
  membershipRule: string | null
  /** Group-based licensing: members inherit these. */
  licenses: { skuId: string; name: string }[]
  members: GroupMember[]
  owners: GroupMember[]
}

/** Graph can only create Microsoft 365 and Security groups; the other kinds come from Exchange. */
export type CreatableKind = 'Microsoft 365' | 'Security'

export interface CreateGroupRequest {
  kind: CreatableKind
  displayName: string
  description?: string
  /** Empty: the server derives it from the name. */
  mailNickname?: string
  isAssignableToRole: boolean
  /** Set: a dynamic membership group. */
  membershipRule?: string
}

export interface GroupUpdate {
  displayName?: string
  description?: string
}
