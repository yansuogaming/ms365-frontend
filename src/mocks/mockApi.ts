/**
 * DEV-ONLY fake backend, used by `npm run dev:mock` to preview screens before the
 * real API exists. It is loaded through a dynamic import guarded by
 * `import.meta.env.DEV`, so it is never part of a production build.
 *
 * All names use Microsoft's fictional "Contoso" sample tenant. Do not put real
 * tenant data here.
 *
 * Preview other states with a query string on any page:
 *   ?mock=empty   every list empty, every count null ("Not reported")
 *   ?mock=error   every request fails with 500
 *   ?mock=slow    3 s latency, to see loading skeletons
 */

type Init = { method?: string; body?: string }

const SESSION_KEY = 'm365-mock-signed-in'

const session = {
  user: { upn: 'operator@contoso.onmicrosoft.com', displayName: 'Ops Operator', role: 'Global Administrator' },
  tenant: { id: '00000000-0000-4000-8000-000000000000', domain: 'contoso.onmicrosoft.com', displayName: 'Contoso School District' },
}

const day = 86_400_000
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

const recentUsers = [
  { id: 'u1', displayName: 'Megan Bowen', upn: 'meganb@contoso.onmicrosoft.com', status: 'active', createdAt: ago(0.3 * day) },
  { id: 'u2', displayName: 'Alex Wilber', upn: 'alexw@contoso.onmicrosoft.com', status: 'active', createdAt: ago(1.2 * day) },
  { id: 'u3', displayName: 'Lynne Robbins', upn: 'lynner@contoso.onmicrosoft.com', status: 'blocked', createdAt: ago(2.6 * day) },
  { id: 'u4', displayName: 'Diego Siciliani', upn: 'diegos@contoso.onmicrosoft.com', status: 'pending', createdAt: ago(4.1 * day) },
  { id: 'u5', displayName: 'Isaiah Langer', upn: 'isaiahl@contoso.onmicrosoft.com', status: 'active', createdAt: ago(6.8 * day) },
]

const syncStatus = { directorySync: false, passwordSync: null as boolean | null, onPremHelper: true }

function scenario() {
  return new URLSearchParams(window.location.search).get('mock')
}

class MockHttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function route(method: string, path: string, body: Record<string, unknown>): unknown {
  const empty = scenario() === 'empty'
  const signedIn = sessionStorage.getItem(SESSION_KEY) === '1'
  const requireSession = () => {
    if (!signedIn) throw new MockHttpError(401, 'Not signed in.')
  }

  switch (`${method} ${path.split('?')[0]}`) {
    case 'GET /health':
      return { ok: true }

    case 'POST /auth/login': {
      const password = String(body.password ?? '')
      if (password.toLowerCase() === 'wrong') throw new MockHttpError(401, 'Email or password is incorrect.')
      sessionStorage.setItem(SESSION_KEY, '1')
      return session
    }
    case 'GET /auth/session':
      requireSession()
      return session
    case 'POST /auth/logout':
      sessionStorage.removeItem(SESSION_KEY)
      return undefined

    case 'GET /dashboard/summary':
      requireSession()
      return {
        tenant: session.tenant,
        users: { total: empty ? null : 1284, addedLast7Days: empty ? null : 12 },
        licenses: { used: empty ? null : 1190, available: empty ? null : 58 },
        groups: { total: empty ? null : 46 },
        devices: { managed: empty ? null : 212, nonCompliant: empty ? null : 4 },
      }
    case 'GET /dashboard/recent-users':
      requireSession()
      return empty ? [] : recentUsers

    case 'GET /directory/sync-status':
      requireSession()
      return empty ? { directorySync: null, passwordSync: null, onPremHelper: null } : syncStatus
    case 'POST /directory/sync':
      requireSession()
      syncStatus.directorySync = Boolean(body.enabled)
      return syncStatus
    case 'POST /directory/password-sync':
      requireSession()
      syncStatus.passwordSync = Boolean(body.enabled)
      return syncStatus

    case 'POST /directory/protected-admin/diagnose': {
      requireSession()
      const upn = String(body.upn ?? '')
      if (!upn.endsWith('contoso.onmicrosoft.com')) throw new MockHttpError(404, `No user ${upn} in this tenant.`)
      return {
        upn,
        protected: false,
        passwordWriteback: null,
        checks: [
          { id: 'directorySync', state: syncStatus.directorySync ? 'pass' : 'fail', detail: syncStatus.directorySync ? undefined : 'Tenant directory sync is off.' },
          { id: 'passwordSync', state: 'unknown', detail: 'Not reported by Graph.' },
          { id: 'passwordWritebackOff', state: 'unknown' },
          { id: 'userSynced', state: 'fail', detail: 'User is cloud-only.' },
          { id: 'globalAdminRole', state: 'pass' },
        ],
      }
    }

    case 'GET /directory/ad-helper/status':
      requireSession()
      return empty
        ? { enabled: false, checks: { adModule: 'unknown', adLoaded: 'unknown', domain: 'unknown', adSync: 'unknown', entraConnect: 'unknown' }, domainFqdn: null }
        : { enabled: true, checks: { adModule: 'ok', adLoaded: 'ok', domain: 'ok', adSync: 'ok', entraConnect: 'missing' }, domainFqdn: 'ad.contoso.local' }

    case 'POST /directory/ad-helper/setup-script': {
      requireSession()
      const b = body as Record<string, string | boolean>
      return {
        script: [
          '# Generated by M365 Admin (mock). Review before running on the AD host.',
          'Import-Module ActiveDirectory',
          `New-ADUser -Name '${b.samAccountName}' -SamAccountName '${b.samAccountName}' -UserPrincipalName '${b.samAccountName}@${b.upnSuffix}' -Path '${b.ouDn}' -Server '${b.domainFqdn}' -Enabled $true`,
          b.passwordNeverExpires ? `Set-ADUser '${b.samAccountName}' -PasswordNeverExpires $true` : '',
          b.cannotChangePassword ? `Set-ADUser '${b.samAccountName}' -CannotChangePassword $true` : '',
          'Start-ADSyncSyncCycle -PolicyType Delta',
        ]
          .filter(Boolean)
          .join('\n'),
      }
    }
    case 'POST /directory/ad-helper/synced-admin': {
      requireSession()
      const b = body as Record<string, string>
      return {
        outcome: 'created',
        distinguishedName: `CN=${b.samAccountName},${b.ouDn}`,
        message: 'Run an AD delta sync to link it to the cloud account.',
      }
    }
    case 'POST /directory/ad-helper/delta-sync':
      requireSession()
      return { message: 'Delta sync started. Changes usually reach Entra within 2 minutes.' }
  }
  throw new MockHttpError(404, `Mock API has no handler for ${method} ${path}.`)
}

/** Same contract as fetch: returns a Response, so apiFetch handles it like the real API. */
export async function mockFetch(path: string, init: Init = {}): Promise<Response> {
  const s = scenario()
  await sleep(s === 'slow' ? 3000 : 250 + Math.random() * 350)

  const json = (status: number, data: unknown) =>
    new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

  if (s === 'error' && path !== '/health' && !path.startsWith('/auth/')) {
    return json(500, { message: 'Mock API: simulated server error (?mock=error).' })
  }

  try {
    const body = init.body ? (JSON.parse(init.body) as Record<string, unknown>) : {}
    const data = route((init.method ?? 'GET').toUpperCase(), path, body)
    return json(data === undefined ? 204 : 200, data)
  } catch (e) {
    if (e instanceof MockHttpError) return json(e.status, { message: e.message })
    throw e
  }
}
