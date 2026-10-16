# M365 Admin API contract

This is the contract the frontend calls today. Request and response types live next to each feature in `src/features/<module>/types.ts`; this document mirrors them. New modules append their own section as they are built.

## Conventions

- **Base URL**: `VITE_API_BASE_URL` (see `.env.example`). Every path below is relative to it.
- **Format**: JSON in and out, `Content-Type: application/json`.
- **Session**: an **httpOnly, Secure, SameSite** cookie set by `POST /auth/login`. The frontend sends it with `credentials: 'include'` and never reads or stores a token. If the API is on another origin, CORS must allow that origin with `Access-Control-Allow-Credentials: true`.
- **Tenant scope**: every call after sign-in acts on the tenant of the current session. The frontend never sends a tenant ID.
- **Errors**: any non-2xx status with the body `{ "message": string, "code"?: string }`. The `message` is shown to the operator as-is, so write it for a person and never include secrets or stack traces.
  - `401` when the session is missing or expired: the frontend goes back to the login page.
  - `429` when rate limited: shown as "Too many attempts".
- **Unknown values**: when the backend cannot read a value from Microsoft Graph, return `null`. The UI shows "Not reported" or "Unknown". It never shows a guessed number.
- **Dates**: ISO 8601 strings in UTC.

## Security requirements

- The login credential arrives as `username` + `password`. Do not log it, echo it back, or keep it beyond what the backend's Graph auth flow needs.
- `POST /directory/protected-admin/diagnose` takes a UPN only and must never accept a password.
- Tenant-wide switches (`/directory/sync`, `/directory/password-sync`) change settings for every user. Audit-log who changed them.

## Health

### `GET /health`
Polled every 60 s for the "API online" indicator. Any 2xx response means online; the body is ignored.

## Auth

### `POST /auth/login`
The operator pastes `email:password` into one field. The frontend splits it at the first colon and sends:

```json
{ "username": "admin@tenant.onmicrosoft.com", "password": "…" }
```

**200** sets the session cookie and returns a `Session`:

```json
{
  "user":   { "upn": "admin@tenant.onmicrosoft.com", "displayName": "Admin", "role": "Global Administrator" },
  "tenant": { "id": "00000000-0000-0000-0000-000000000000", "domain": "tenant.onmicrosoft.com", "displayName": "Tenant name" }
}
```

**401 / 403**: wrong credential ("Email or password is incorrect for this tenant"). **429**: rate limited.

### `GET /auth/session`
Called on every page load to restore the session. **200** returns `Session`, **401** when not signed in.

### `POST /auth/logout`
Clears the session cookie. **204**.

## Dashboard

### `GET /dashboard/summary`

```json
{
  "tenant":   { "id": "…", "displayName": "…", "domain": "…" },
  "users":    { "total": 0, "addedLast7Days": 0 },
  "licenses": { "used": 0, "available": 0 },
  "groups":   { "total": 0 },
  "devices":  { "managed": 0, "nonCompliant": 0 }
}
```

Any number may be `null`.

### `GET /dashboard/recent-users?limit=5`
The newest users first.

```json
[
  { "id": "…", "displayName": "…", "upn": "…", "status": "active", "createdAt": "2026-10-15T09:12:00Z" }
]
```

`status` is one of `"active" | "blocked" | "pending"`.

### `GET /directory/sync-status`

```json
{ "directorySync": false, "passwordSync": null, "onPremHelper": false }
```

- `directorySync`: Entra `onPremisesSyncEnabled` at tenant level, not the per-user sync badge.
- `passwordSync`: Entra `features.passwordSyncEnabled`.
- `onPremHelper`: whether the on-premises AD setup helper is available for this tenant.

Each value may be `null` (unknown).

### `POST /directory/sync`
Body `{ "enabled": boolean }`. Returns the updated `SyncStatus`. The UI asks the operator to confirm first.

### `POST /directory/password-sync`
Body `{ "enabled": boolean }`. Returns the updated `SyncStatus`. The UI asks the operator to confirm first.

### `POST /directory/protected-admin/diagnose`
Body `{ "upn": "admin@domain.com" }`. If the operator pastes `email:password`, the frontend keeps only the email.

```json
{
  "upn": "admin@domain.com",
  "protected": false,
  "passwordWriteback": null,
  "checks": [
    { "id": "directorySync",        "state": "pass" },
    { "id": "passwordSync",         "state": "unknown", "detail": "Not reported by Graph" },
    { "id": "passwordWritebackOff", "state": "unknown" },
    { "id": "userSynced",           "state": "fail", "detail": "User is cloud-only" },
    { "id": "globalAdminRole",      "state": "pass" }
  ]
}
```

- `state` is one of `"pass" | "fail" | "unknown"`.
- `detail` is optional, written for the operator.
- **404** when the UPN does not exist in the tenant.

## On-prem AD helper

Runs on the backend host (Windows Server with the RSAT ActiveDirectory module). It must **fail closed**: unless `MAILCREATE_AD_HELPER_ENABLED=1` is set, `status` reports `enabled: false` and every write endpoint returns **403** with a message saying the helper is disabled. The UI only opens this section on request and asks the operator to confirm before creating an account.

The three POST endpoints share these account options:

```json
{
  "upn": "admin@example.com",
  "domainFqdn": "ad.example.com",
  "upnSuffix": "example.com",
  "ouDn": "OU=SyncedAdmins,DC=ad,DC=example,DC=com",
  "samAccountName": "admin",
  "passwordNeverExpires": true,
  "cannotChangePassword": true
}
```

- `samAccountName` is at most 20 characters, with no spaces or `@`.
- No password is ever sent from the UI. If the backend needs one for the new AD account, it generates it and never returns it.

### `GET /directory/ad-helper/status`
Fetched when the operator opens the section, and again on "Check AD helper".

```json
{
  "enabled": false,
  "checks": { "adModule": "ok", "adLoaded": "ok", "domain": "ok", "adSync": "missing", "entraConnect": "unknown" },
  "domainFqdn": "ad.example.com"
}
```

- Each check is one of `"ok" | "missing" | "unknown"`.
- `domainFqdn` is the domain detected on the host, or `null`. The UI uses it as the default when the field is left empty.

### `POST /directory/ad-helper/setup-script`
Body: the account options. Returns `{ "script": string }`, a PowerShell script the operator can review and copy to run by hand. This endpoint is read-only and changes nothing. It works even when the helper is disabled.

### `POST /directory/ad-helper/synced-admin`
Body: the account options. Creates the AD user matching the cloud UPN, or matches an existing one, then applies the selected options (including the "User cannot change password" ACL).

```json
{ "outcome": "created", "distinguishedName": "CN=admin,OU=SyncedAdmins,DC=ad,DC=example,DC=com", "message": "Run an AD delta sync to link it to the cloud account." }
```

`outcome` is one of `"created" | "matched"`.

### `POST /directory/ad-helper/delta-sync`
Triggers `Start-ADSyncSyncCycle -PolicyType Delta`. Returns `{ "message": string }`.
