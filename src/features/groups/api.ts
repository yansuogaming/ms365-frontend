import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'
import type { BulkResult, Page } from '@/lib/api/types'
import type { CreateGroupRequest, GroupDetail, GroupListQuery, GroupRow, GroupUpdate } from './types'

const keys = {
  all: ['groups'] as const,
  list: (q: GroupListQuery) => ['groups', 'list', q] as const,
  detail: (id: string) => ['groups', 'detail', id] as const,
}

function listPath(q: GroupListQuery) {
  const p = new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize), sort: q.sort })
  if (q.search) p.set('search', q.search)
  if (q.kind) p.set('kind', q.kind)
  return `/groups?${p}`
}

/** `ref` is a UPN, an email or an object id; the server resolves it. */
type Ref = { ref: string }

export const groupsApi = {
  list: (q: GroupListQuery) => apiFetch<Page<GroupRow>>(listPath(q)),
  get: (id: string) => apiFetch<GroupDetail>(`/groups/${id}`),
  create: (body: CreateGroupRequest) => apiFetch<GroupRow>('/groups', { method: 'POST', body: { ...body } }),
  update: (id: string, body: GroupUpdate) => apiFetch<GroupRow>(`/groups/${id}`, { method: 'PATCH', body: { ...body } }),
  remove: (ids: string[]) => apiFetch<BulkResult>('/groups/bulk/delete', { method: 'POST', body: { ids } }),
  addLicense: (id: string, skuId: string) => apiFetch<void>(`/groups/${id}/licenses`, { method: 'POST', body: { skuId } }),
  removeLicense: (id: string, skuId: string) => apiFetch<void>(`/groups/${id}/licenses/${skuId}`, { method: 'DELETE' }),
  addMember: (id: string, body: Ref) => apiFetch<void>(`/groups/${id}/members`, { method: 'POST', body }),
  removeMember: (id: string, memberId: string) => apiFetch<void>(`/groups/${id}/members/${memberId}`, { method: 'DELETE' }),
  addOwner: (id: string, body: Ref) => apiFetch<void>(`/groups/${id}/owners`, { method: 'POST', body }),
  removeOwner: (id: string, ownerId: string) => apiFetch<void>(`/groups/${id}/owners/${ownerId}`, { method: 'DELETE' }),
}

export const useGroupList = (q: GroupListQuery) => useQuery({ queryKey: keys.list(q), queryFn: () => groupsApi.list(q), placeholderData: keepPreviousData })

export const useGroupDetail = (id: string) => useQuery({ queryKey: keys.detail(id), queryFn: () => groupsApi.get(id) })

/** Any change to groups: run it, then refresh every group list, detail and picker (all under ['groups']). */
export function useGroupMutation<V, R>(fn: (v: V) => Promise<R>, onDone?: (r: R, v: V) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, v) => onDone?.(r, v),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}
