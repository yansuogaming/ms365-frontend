import { apiFetch } from '@/lib/api/client'
import type { LoginRequest, Session } from './types'

export const authApi = {
  session: () => apiFetch<Session>('/auth/session'),
  login: (body: LoginRequest) => apiFetch<Session>('/auth/login', { method: 'POST', body: { ...body } }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
}

/**
 * Splits the single "email:password" credential string.
 * Email addresses cannot contain ":", so the first colon is the separator and
 * the password may contain further colons.
 */
export function parseCredential(raw: string): LoginRequest | null {
  const value = raw.trim()
  const sep = value.indexOf(':')
  if (sep <= 0) return null

  const username = value.slice(0, sep).trim()
  const password = value.slice(sep + 1)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || password.length === 0) return null

  return { username, password }
}
