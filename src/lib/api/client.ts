const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

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
    res = await fetch(`${BASE_URL}${path}`, {
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

/** Downloads a non-JSON response (e.g. a TXT export) as a file named by the server or `fallbackName`. */
export async function apiDownload(path: string, fallbackName: string) {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' })
  } catch {
    throw new ApiError(0, 'Cannot reach the API. Check your connection or the API URL.')
  }
  if (!res.ok) {
    const err = ((await res.json().catch(() => null)) ?? {}) as { message?: string; code?: string }
    throw new ApiError(res.status, err.message ?? `Download failed (${res.status}).`, err.code)
  }
  const name = /filename="?([^";]+)"?/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? fallbackName
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}
