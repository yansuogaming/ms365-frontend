import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/components/ui/Toaster'
import { authApi } from './api'
import type { LoginRequest } from './types'

export const sessionKey = ['auth', 'session'] as const

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: authApi.session,
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    // LoginPage words the failure itself (wrong credential vs. rate limit vs. offline).
    meta: { silentError: true },
    onSuccess: (session) => {
      qc.setQueryData(sessionKey, session)
      notify.success(`Signed in to ${session.tenant.domain}`)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => notify.success('Signed out'),
    onSettled: () => qc.clear(),
  })
}
