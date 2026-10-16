import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/components/ui/Toaster'
import { apiFetch } from '@/lib/api/client'
import type { AdAccountOptions, AdHelperStatus, DashboardSummary, ProtectionDiagnosis, RecentUser, SyncedAdminResult, SyncStatus } from './types'

export const dashboardApi = {
  summary: () => apiFetch<DashboardSummary>('/dashboard/summary'),
  recentUsers: (limit = 5) => apiFetch<RecentUser[]>(`/dashboard/recent-users?limit=${limit}`),
  syncStatus: () => apiFetch<SyncStatus>('/directory/sync-status'),
  setDirectorySync: (enabled: boolean) => apiFetch<SyncStatus>('/directory/sync', { method: 'POST', body: { enabled } }),
  setPasswordSync: (enabled: boolean) => apiFetch<SyncStatus>('/directory/password-sync', { method: 'POST', body: { enabled } }),
  // Only the UPN is sent. Never send a password to this endpoint.
  diagnoseProtection: (upn: string) => apiFetch<ProtectionDiagnosis>('/directory/protected-admin/diagnose', { method: 'POST', body: { upn } }),
  adHelperStatus: () => apiFetch<AdHelperStatus>('/directory/ad-helper/status'),
  adSetupScript: (options: AdAccountOptions & { upn: string }) =>
    apiFetch<{ script: string }>('/directory/ad-helper/setup-script', { method: 'POST', body: { ...options } }),
  createSyncedAdmin: (options: AdAccountOptions & { upn: string }) =>
    apiFetch<SyncedAdminResult>('/directory/ad-helper/synced-admin', { method: 'POST', body: { ...options } }),
  runDeltaSync: () => apiFetch<{ message: string }>('/directory/ad-helper/delta-sync', { method: 'POST' }),
}

const keys = {
  summary: ['dashboard', 'summary'] as const,
  recentUsers: ['dashboard', 'recent-users'] as const,
  syncStatus: ['directory', 'sync-status'] as const,
  adHelper: ['directory', 'ad-helper'] as const,
}

export const useSummary = () => useQuery({ queryKey: keys.summary, queryFn: dashboardApi.summary })
export const useRecentUsers = () => useQuery({ queryKey: keys.recentUsers, queryFn: () => dashboardApi.recentUsers(5) })
export const useSyncStatus = () => useQuery({ queryKey: keys.syncStatus, queryFn: dashboardApi.syncStatus })

export function useSetSync(kind: 'directory' | 'password') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => (kind === 'directory' ? dashboardApi.setDirectorySync(enabled) : dashboardApi.setPasswordSync(enabled)),
    onSuccess: (status, enabled) => {
      qc.setQueryData(keys.syncStatus, status)
      notify.success(`${kind === 'directory' ? 'Tenant directory sync' : 'Password sync'} turned ${enabled ? 'on' : 'off'}`)
    },
  })
}

export const useDiagnoseProtection = () =>
  useMutation({
    mutationFn: dashboardApi.diagnoseProtection,
    onSuccess: (d) => {
      const failed = d.checks.filter((c) => c.state === 'fail').length
      if (d.protected) notify.success(`${d.upn} is protected`)
      else notify.warning(`${d.upn} is not protected`, { description: failed ? `${failed} of ${d.checks.length} checks failed.` : 'Some checks could not be confirmed.' })
    },
  })

export function useRefreshDashboard() {
  const qc = useQueryClient()
  return async () => {
    try {
      await Promise.all([keys.summary, keys.recentUsers, keys.syncStatus].map((queryKey) => qc.refetchQueries({ queryKey }, { throwOnError: true })))
      notify.success('Dashboard refreshed')
    } catch (e) {
      notify.error('Some dashboard data could not be refreshed', { description: e instanceof Error ? e.message : undefined })
    }
  }
}

export const useAdHelperStatus = (enabled: boolean) =>
  useQuery({ queryKey: keys.adHelper, queryFn: dashboardApi.adHelperStatus, enabled })
export const useAdSetupScript = () =>
  useMutation({ mutationFn: dashboardApi.adSetupScript, onSuccess: () => notify.success('Setup script generated', { description: 'Review it before running it on the AD host.' }) })
export const useCreateSyncedAdmin = () =>
  useMutation({
    mutationFn: dashboardApi.createSyncedAdmin,
    onSuccess: (r) => notify.success(`${r.outcome === 'created' ? 'Created' : 'Matched'} synced admin`, { description: r.message }),
  })
export const useRunDeltaSync = () =>
  useMutation({ mutationFn: dashboardApi.runDeltaSync, onSuccess: (r) => notify.success('AD delta sync started', { description: r.message }) })
