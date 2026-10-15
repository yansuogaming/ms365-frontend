# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite + TypeScript, Tailwind CSS v4, React Router, TanStack Query, lucide-react. Static SPA; the backend is built by a separate team and reached through `VITE_API_BASE_URL`.

## Users

A small internal operations team that signs in to many different Microsoft 365 tenants and runs repetitive admin tasks there every day (create mailboxes, reset passwords, check licenses, review users, devices and security settings).

## Product Purpose

A single admin console that puts the tenant tasks the team runs most often behind one sign-in, faster than moving through the native Microsoft admin centers. Success means a task is found and finished in a few clicks, and the operator always knows which tenant they are acting on.

## Operating Context

- Sign-in is per tenant: the operator pastes one credential string in the form `email:password`. There is no landing page; the app opens straight to sign-in.
- After sign-in the active tenant domain is always visible in the sidebar header.
- Navigation groups: Quick actions, Overview, Identity, Billing, Security, Devices, Admin 365 (full list in `src/app/navigation.ts`).
- Long sessions, many tenants per day, desktop-first.

## Capabilities and Constraints

- Frontend only. No mock data anywhere: every view renders loading, empty and error states until the backend returns real data.
- Each module lives in its own folder with typed request/response contracts so the backend team can implement against them.
- Credentials are never persisted on the client (no localStorage/sessionStorage of the credential string) and never logged. The session token handling is decided by the backend.
- No real tenant names, IDs, emails or secrets in the repository.
- UI language: English, using Microsoft 365 terminology.

## Brand Commitments

Product name shown in the UI: "M365 Admin".

## Evidence on Hand

None. There is no real data, customer content or screenshots to ship; future work must not fabricate any.

## Product Principles

1. The active tenant is never ambiguous.
2. Frequent tasks are one click from anywhere.
3. Honest states: show loading, empty and error explicitly instead of placeholders that look like data.
4. Sensitive input is handled minimally and never retained.
