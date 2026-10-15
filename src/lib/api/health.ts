import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'

export type ApiStatus = 'checking' | 'online' | 'offline'

export function useApiStatus(): ApiStatus {
  const { isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<unknown>('/health'),
    refetchInterval: 60_000,
    retry: false,
  })
  if (isPending) return 'checking'
  return isError ? 'offline' : 'online'
}
