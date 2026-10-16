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

## Pagination (all list endpoints)

List endpoints take `page` (1-based) and `pageSize` (10, 25, 50 or 100) and return:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 25 }
```

`total` is the count after filters, so the UI can show "26–50 of 1,284" and page numbers. Bulk endpoints return a `BulkResult`:

```json
{ "succeeded": 3, "failed": [{ "id": "…", "label": "user@domain.com", "error": "Insufficient privileges" }] }
```

## Users

### `GET /users`
Query: `page`, `pageSize`, `search` (matches display name or UPN), `status` (`active` | `blocked`), `license` (a `skuId`, `has` for any license, or `none` for unlicensed users), `role` (a role name, or `any` for any admin role), `sort` (`createdAt` | `displayName` | `oneDrive`, then `:asc` | `:desc`; the default is `createdAt:desc`). Omitted filters mean "any". Returns `Page<UserRow>`:

```json
{
  "id": "…", "displayName": "…", "upn": "…", "status": "active",
  "licenses": [{ "skuId": "…", "name": "Office 365 A1 for faculty" }],
  "roles": ["User Administrator"],
  "createdAt": "2026-10-15T09:12:00Z",
  "oneDrive": { "usedBytes": 0, "quotaBytes": 0 }
}
```

`oneDrive` is `null` when OneDrive is not provisioned or its usage cannot be read.

### `GET /users/{id}`
`UserRow` plus `givenName`, `surname`, `jobTitle`, `department`, `usageLocation` (2 letters). Used by the Edit dialog.

### `PATCH /users/{id}`
Body: any subset of `displayName`, `givenName`, `surname`, `jobTitle`, `department`, `usageLocation`. Only changed fields are sent. Returns the updated `UserRow`.

### `POST /users/{id}/rename`
Body `{ "upn": "new@verified-domain.com", "displayName"?: "…" }`. Returns the updated `UserRow`. The domain must be a verified domain from `GET /organization`.

### Bulk actions
Each takes `{ "ids": string[], … }` and returns a `BulkResult`. The UI always asks the operator to confirm first.

| Endpoint | Extra body | Effect |
|---|---|---|
| `POST /users/bulk/block` | `"blocked": boolean` | Block or unblock sign-in |
| `POST /users/bulk/revoke-sessions` | none | Revoke refresh tokens and sessions |
| `POST /users/bulk/force-password-change` | none | Require a new password at next sign-in |
| `POST /users/bulk/language` | `"language": "vi-VN"` | Set `preferredLanguage` |
| `POST /users/bulk/edit` | see below | Roles and shared fields |
| `POST /users/bulk/rename` | see below (no `ids`) | Display names / usernames |
| `POST /users/bulk/mfa/phone` | `"entries": [{ "id", "phoneNumber" }]` instead of `ids` | Add an SMS phone method. `phoneNumber` is already in the Graph format `+{country code} {number}`, e.g. `+84 901234567` (the UI picks the country and drops the trunk 0) |
| `POST /users/bulk/mfa/email` | `"entries": [{ "id", "email" }]` instead of `ids` | Set the SSPR recovery email: write it to the user's `otherMails` via Graph, as the original console does |
| `POST /users/bulk/delete` | none | Soft delete (restorable for 30 days) |

### `POST /users/bulk/edit`

```json
{
  "ids": ["…"],
  "roles": { "mode": "assign", "roleIds": ["…"] },
  "removeAllRoles": false,
  "fields": { "usageLocation": "VN", "jobTitle": "", "department": "IT" }
}
```

- `roles` and `removeAllRoles` are both optional and never sent together. `removeAllRoles: true` removes every directory role the users hold.
- `fields` contains only the fields the operator ticked. An empty string clears that field.
- Role ids come from `GET /directory/role-definitions`, which returns `[{ "id", "name" }]` for every assignable role.

### `POST /users/bulk/rename`
The single Rename dialog uses this endpoint for one user or many.

```json
{ "changes": [{ "id": "…", "displayName": "New name", "upnLocal": "new.name", "domain": "contoso.com" }] }
```

- The UI computes each new value (prefix, suffix, find & replace, numbered set, or one by one) and sends only what changed.
- `upnLocal` is the part before `@`.
- `domain` is present only when the operator moves users to another verified domain; otherwise keep the current domain.
- Reject a UPN that is already taken with a per-user failure in the `BulkResult`.

### `POST /users/bulk/delete-by-upn`
Body `{ "upns": string[] }`. The UI reads the TXT file on the operator's device and sends the parsed list (lowercased and de-duplicated). Returns a `BulkResult` whose `label` is the UPN.

### Credentials: `POST /users/bulk/reset-password` and `POST /users/bulk/tap`

| Endpoint | Body |
|---|---|
| `POST /users/bulk/reset-password` | `{ "ids": string[], "requireChange": boolean }` |
| `POST /users/bulk/tap` | `{ "ids": string[], "lifetimeMinutes": 60, "oneTime": true }` |

Both return:

```json
{ "results": [{ "upn": "…", "secret": "…", "expiresAt"?: "…" }, { "upn": "…", "error": "…" }] }
```

The UI shows each `secret` once and never stores it. The backend must not log these values either.

### `GET /users/export?format=txt&…`
Takes the same filters as `GET /users`, without paging. Returns `text/plain`, one UPN per line, with `Content-Disposition: attachment; filename="users.txt"`.

### Lookups

| Endpoint | Returns |
|---|---|
| `GET /licenses/skus` | `[{ "skuId", "name", "consumed", "enabled" }]`. Used by the license filter and the License usage dialog. |
| `GET /directory/roles` | `[{ "name", "memberCount" }]`. Used by the role filter. |
| `GET /organization` | `{ "displayName", "tenantId", "country", "createdAt", "technicalContacts": string[], "domains": [{ "name", "isDefault", "isVerified" }] }`. |

### Create user: `POST /users`

```json
{
  "displayName": "Jane Doe", "upnLocal": "jane.doe", "domain": "contoso.com",
  "password": "Tsg78374", "forceChangePassword": false, "usageLocation": "US",
  "skuIds": ["…"], "groupIds": ["…"], "roleIds": ["…"],
  "sendCredentialsTo": "manager@example.com"
}
```

- Returns the new `UserRow`. **409** when the UPN is taken.
- The password is generated in the browser (crypto random) and shown to the operator once. The backend must not log it.
- With `sendCredentialsTo`, the backend emails the sign-in details to that address.

### Invite guest: `POST /users/invite`
Body `{ "email": "person@partner.com", "displayName"?: "…", "sendInvitationEmail": true }`. Returns `{ "user": UserRow, "inviteRedeemUrl": "…" }`. This is a Graph B2B invitation and needs `User.Invite.All`.

### Groups: `GET /groups/options`
Returns `[{ "id", "displayName" }]` for the group pickers.

### One user (Edit user dialog)

| Endpoint | Body | Notes |
|---|---|---|
| `GET /users/{id}` | none | Also returns `mobilePhone`, `accountEnabled` and `recoveryEmail` (or `null`). |
| `PATCH /users/{id}` | any of the profile fields, plus `mobilePhone` and `accountEnabled` | Username or domain changes go through `/rename` first. |
| `POST /users/{id}/password` | `{ "password", "forceChange" }` | 204 |
| `POST /users/{id}/revoke-mfa` | none | Revokes sessions and removes MFA methods so the user registers again. 204 |
| `PUT /users/{id}/recovery-email` | `{ "email": "…" \| null }` | SSPR recovery email, stored in `otherMails`; `null` removes it. 204 |
| `POST /users/{id}/licenses` | `{ "add": skuIds, "remove": skuIds }` | Returns `UserRow`. |
| `GET /users/{id}/groups` | none | The user's groups, `[{ "id", "displayName" }]`. Loaded on demand. |
| `POST /users/{id}/groups` | `{ "add": groupIds, "remove": groupIds }` | Returns the updated group list. |
| `PUT /users/{id}/roles` | `{ "roleIds": [...] }` | The **full** set the user should hold; the backend applies the difference. |

### Organization: `PATCH /organization`
`GET /organization` also returns `"preferredLanguage": "en-GB"` (or `null`).

```json
{ "technicalContact": "admin@example.com", "preferredLanguage": "en-GB", "applyToAllUsers": false, "includeMailbox": false }
```

- `applyToAllUsers: true` also sets `preferredLanguage` on every user in the tenant. This is not reverted automatically.
- `includeMailbox` (only with `applyToAllUsers`) also changes each mailbox's Outlook language.
- Returns `{ "organization": OrgProfile, "usersUpdated"?: number }`.

### License usage scan
A long-running job. The UI starts it, then polls every 1.5 s until `state` is not `running`.

#### `POST /licenses/usage/scan`
Returns `{ "jobId": "…" }`.

```json
{ "period": "D30", "activeDays": 30, "maxUsers": 5000, "targets": ["user@domain.com"] }
```

- `period` is the Graph usage-report period: `D7` | `D30` | `D90` | `D180`.
- A licensed user with no activity in `activeDays` (1–180) is inactive.
- `targets` is optional and limits the scan to those UPNs. The UI strips anything after `:` from pasted `mail:pass` lines, so only emails are ever sent.

#### `GET /licenses/usage/scan/{jobId}`

```json
{
  "id": "…",
  "state": "running",
  "progress": { "scanned": 120, "total": 500 },
  "summary": { "licensed": 0, "active": 0, "inactive": 0, "auditLimited": 0, "neverUsed": 0, "noLicense": 0, "scanned": 0 },
  "rows": [{ "id": "…", "displayName": "…", "upn": "…", "status": "inactive", "licenses": ["Office 365 A1 for faculty"], "lastSeen": "2026-09-01T08:00:00Z", "signal": "Sign-in", "device": "Windows · Outlook" }],
  "error": "only when state is failed"
}
```

- `state` is one of `"running" | "done" | "failed"`.
- `summary` may update while the scan is running. `rows` may stay empty until the scan is `done`.
- `status` is one of `active` | `inactive` | `auditLimited` (usage hidden by the tenant's privacy setting) | `neverUsed` | `noLicense`.
- The UI filters, searches, pages and exports CSV on the client.

`GET /directory/role-definitions` should list the common admin roles first (Global, User, Security, Conditional Access, Privileged Authentication, Helpdesk, Billing, Password, Application, Privileged Role, Exchange, SharePoint, Skype for Business), because the Roles filter shows them in the order returned.

### Deleted users
Soft-deleted accounts (Entra keeps them for 30 days). `POST /users/bulk/delete` and `POST /users/bulk/delete-by-upn` move users here.

#### `GET /users/deleted`
Query: `page`, `pageSize`, `search` (name or UPN). Returns `Page<DeletedUser>`:

```json
{ "id": "…", "displayName": "…", "upn": "…", "deletedAt": "2026-10-15T09:12:00Z" }
```

The UI computes the days left from `deletedAt` plus 30 days.

#### `POST /users/deleted/restore` and `POST /users/deleted/purge`
Body: either `{ "ids": string[] }`, or `{ "all": true, "search": "…" }` for "Restore all" / "Delete all permanently" (everything matching the current search; an empty search means all). Returns a `BulkResult`.

Purge is irreversible. The UI asks for confirmation, and for "all" the operator must type DELETE.

### Planned screens
`/identity/users/bulk-create` exists as a route, but its screen is not built yet. Their API contract will be added here when they are.
