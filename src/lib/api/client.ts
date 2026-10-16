const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

// `npm run dev:mock`: answer from the dev-only fake backend. Always false in production builds.
const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_MOCK === 'true'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  /** True when the request never reached the server (offline, CORS, DNS). */
  get isNetwork() {
    return this.status === 0
  }
}

type Json = Record<string, unknown> | unknown[]

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Json
}

/**
 * Thin fetch wrapper used by every feature's api.ts.
 * The session lives in an httpOnly cookie set by the backend, so the client
 * never stores or attaches credentials itself.
 */
export async function apiFetch<T>(path: string, { body, headers, ...init }: RequestOptions = {}): Promise<T> {
  const payload = body !== undefined ? JSON.stringify(body) : undefined
  let res: Response
  try {
    res = USE_MOCK
      ? await (await import('@/mocks/mockApi')).mockFetch(path, { method: init.method, body: payload })
      : await fetch(`${BASE_URL}${path}`, {
          ...init,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...headers,
          },
          body: payload,
        })
  } catch {
    throw new ApiError(0, 'Cannot reach the API. Check your connection or the API URL.')
  }

  if (res.status === 204) return undefined as T

  const data: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const err = (data ?? {}) as { message?: string; code?: string }
    throw new ApiError(res.status, err.message ?? `Request failed (${res.status}).`, err.code)
  }

  return data as T
}
