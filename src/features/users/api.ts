import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/components/ui/Toaster'
import { apiDownload, apiFetch } from '@/lib/api/client'
import type { BulkResult, Page } from '@/lib/api/types'
import type { BulkEditRequest, CreateUserRequest, CredentialResult, GroupOption, InviteGuestRequest, InviteGuestResult, MembershipChange, DeletedTarget, DeletedUser, DirectoryRole, OrgProfile, OrgUpdate, RenameChange, RoleDefinition, SkuUsage, UsageScanJob, UsageScanRequest, UserDetail, UserEdit, UserListQuery, UserRow } from './types'

function listParams(q: Omit<UserListQuery, 'page' | 'pageSize'> & Partial<Pick<UserListQuery, 'page' | 'pageSize'>>) {
  const p = new URLSearchParams()
  if (q.page) p.set('page', String(q.page))
  if (q.pageSize) p.set('pageSize', String(q.pageSize))
  if (q.search) p.set('search', q.search)
  if (q.status !== 'all') p.set('status', q.status)
  if (q.license) p.set('license', q.license)
  if (q.role) p.set('role', q.role)
  p.set('sort', q.sort)
  return p.toString()
}

const bulk = (action: string, body: Record<string, unknown>) => apiFetch<BulkResult>(`/users/bulk/${action}`, { method: 'POST', body })

export const usersApi = {
  list: (q: UserListQuery) => apiFetch<Page<UserRow>>(`/users?${listParams(q)}`),
  skus: () => apiFetch<SkuUsage[]>('/licenses/skus'),
  roles: () => apiFetch<DirectoryRole[]>('/directory/roles'),
  roleDefinitions: () => apiFetch<RoleDefinition[]>('/directory/role-definitions'),
  orgProfile: () => apiFetch<OrgProfile>('/organization'),
  updateOrg: (body: OrgUpdate) => apiFetch<{ organization: OrgProfile; usersUpdated?: number }>('/organization', { method: 'PATCH', body: { ...body } }),
  exportTxt: (q: Omit<UserListQuery, 'page' | 'pageSize'>) => apiDownload(`/users/export?format=txt&${listParams(q)}`, 'users.txt'),

  create: (body: CreateUserRequest) => apiFetch<UserRow>('/users', { method: 'POST', body: { ...body } }),
  inviteGuest: (body: InviteGuestRequest) => apiFetch<InviteGuestResult>('/users/invite', { method: 'POST', body: { ...body } }),
  groupOptions: () => apiFetch<GroupOption[]>('/groups/options'),
  get: (id: string) => apiFetch<UserDetail>(`/users/${id}`),
  update: (id: string, body: Partial<UserEdit>) => apiFetch<UserRow>(`/users/${id}`, { method: 'PATCH', body: { ...body } }),
  setPassword: (id: string, password: string, forceChange: boolean) => apiFetch<void>(`/users/${id}/password`, { method: 'POST', body: { password, forceChange } }),
  revokeAndReMfa: (id: string) => apiFetch<void>(`/users/${id}/revoke-mfa`, { method: 'POST' }),
  setRecoveryEmail: (id: string, email: string | null) => apiFetch<void>(`/users/${id}/recovery-email`, { method: 'PUT', body: { email } }),
  changeLicenses: (id: string, change: MembershipChange) => apiFetch<UserRow>(`/users/${id}/licenses`, { method: 'POST', body: { ...change } }),
  userGroups: (id: string) => apiFetch<GroupOption[]>(`/users/${id}/groups`),
  changeGroups: (id: string, change: MembershipChange) => apiFetch<GroupOption[]>(`/users/${id}/groups`, { method: 'POST', body: { ...change } }),
  setRoles: (id: string, roleIds: string[]) => apiFetch<UserRow>(`/users/${id}/roles`, { method: 'PUT', body: { roleIds } }),
  rename: (id: string, body: { upn: string; displayName?: string }) => apiFetch<UserRow>(`/users/${id}/rename`, { method: 'POST', body }),

  block: (ids: string[], blocked: boolean) => bulk('block', { ids, blocked }),
  revokeSessions: (ids: string[]) => bulk('revoke-sessions', { ids }),
  forcePasswordChange: (ids: string[]) => bulk('force-password-change', { ids }),
  setLanguage: (ids: string[], language: string) => bulk('language', { ids, language }),
  edit: (req: BulkEditRequest) => bulk('edit', { ...req }),
  renameMany: (changes: RenameChange[]) => bulk('rename', { changes }),
  setMfaPhone: (entries: { id: string; phoneNumber: string }[]) => bulk('mfa/phone', { entries }),
  setMfaEmail: (entries: { id: string; email: string }[]) => bulk('mfa/email', { entries }),
  remove: (ids: string[]) => bulk('delete', { ids }),
  removeByUpn: (upns: string[]) => apiFetch<BulkResult>('/users/bulk/delete-by-upn', { method: 'POST', body: { upns } }),

  deleted: (q: { page: number; pageSize: number; search: string }) =>
    apiFetch<Page<DeletedUser>>(`/users/deleted?page=${q.page}&pageSize=${q.pageSize}${q.search ? `&search=${encodeURIComponent(q.search)}` : ''}`),
  restore: (target: DeletedTarget) => apiFetch<BulkResult>('/users/deleted/restore', { method: 'POST', body: { ...target } }),
  purge: (target: DeletedTarget) => apiFetch<BulkResult>('/users/deleted/purge', { method: 'POST', body: { ...target } }),

  startUsageScan: (req: UsageScanRequest) => apiFetch<{ jobId: string }>('/licenses/usage/scan', { method: 'POST', body: { ...req } }),
  usageScan: (jobId: string) => apiFetch<UsageScanJob>(`/licenses/usage/scan/${jobId}`),

  resetPassword: (ids: string[], requireChange: boolean) =>
    apiFetch<{ results: CredentialResult[] }>('/users/bulk/reset-password', { method: 'POST', body: { ids, requireChange } }),
  createTap: (ids: string[], lifetimeMinutes: number, oneTime: boolean) =>
    apiFetch<{ results: CredentialResult[] }>('/users/bulk/tap', { method: 'POST', body: { ids, lifetimeMinutes, oneTime } }),
}

const keys = {
  all: ['users'] as const,
  list: (q: UserListQuery) => ['users', 'list', q] as const,
  skus: ['licenses', 'skus'] as const,
  roles: ['directory', 'roles'] as const,
  org: ['organization'] as const,
}

/** Keeps the previous page on screen while the next one loads, so the table never collapses. */
export const useUserList = (q: UserListQuery) => useQuery({ queryKey: keys.list(q), queryFn: () => usersApi.list(q), placeholderData: keepPreviousData })
export const useSkus = () => useQuery({ queryKey: keys.skus, queryFn: usersApi.skus, staleTime: 5 * 60_000 })
export const useRoleDefinitions = (enabled: boolean) =>
  useQuery({ queryKey: ['directory', 'role-definitions'], queryFn: usersApi.roleDefinitions, enabled, staleTime: 30 * 60_000 })
export const useRoles = () => useQuery({ queryKey: keys.roles, queryFn: usersApi.roles, staleTime: 5 * 60_000 })
export const useOrgProfile = (enabled: boolean) => useQuery({ queryKey: keys.org, queryFn: usersApi.orgProfile, enabled, staleTime: 5 * 60_000 })

/** Toast for a bulk result: all good, partial, or nothing done. */
export function reportBulk(verb: string, r: BulkResult) {
  if (r.failed.length === 0) notify.success(`${verb} ${r.succeeded} user${r.succeeded === 1 ? '' : 's'}`)
  else if (r.succeeded > 0)
    notify.warning(`${verb} ${r.succeeded}, ${r.failed.length} failed`, { description: r.failed.slice(0, 3).map((f) => `${f.label}: ${f.error}`).join(' · ') })
  else notify.error(`Nothing was ${verb.toLowerCase()}`, { description: r.failed.slice(0, 3).map((f) => `${f.label}: ${f.error}`).join(' · ') })
}

/** Any change to users: run it, report it, refresh every user list. */
export function useUserMutation<V, R>(fn: (v: V) => Promise<R>, onDone?: (r: R, v: V) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, v) => onDone?.(r, v),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}

export const useUserDetail = (id: string | undefined) =>
  useQuery({ queryKey: ['users', 'detail', id], queryFn: () => usersApi.get(id!), enabled: Boolean(id) })

export const useDeletedUsers = (q: { page: number; pageSize: number; search: string }) =>
  useQuery({ queryKey: ['users', 'deleted', q], queryFn: () => usersApi.deleted(q), placeholderData: keepPreviousData })

/** Polls a usage scan every 1.5 s until it finishes. */
export const useUsageScan = (jobId: string | null) =>
  useQuery({
    queryKey: ['licenses', 'usage-scan', jobId],
    queryFn: () => usersApi.usageScan(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (q) => (q.state.data?.state === 'running' || !q.state.data ? 1500 : false),
  })

export const useGroupOptions = (enabled: boolean) =>
  useQuery({ queryKey: ['groups', 'options'], queryFn: usersApi.groupOptions, enabled, staleTime: 5 * 60_000 })
