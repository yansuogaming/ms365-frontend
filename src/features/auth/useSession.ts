import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
    onSuccess: (session) => qc.setQueryData(sessionKey, session),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => qc.clear(),
  })
}
