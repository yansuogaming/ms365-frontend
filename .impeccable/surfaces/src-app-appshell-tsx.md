---
version: 1
slug: "src-app-appshell-tsx"
primary_target: "src/app/AppShell.tsx"
related_targets: ["src/features/auth/LoginPage.tsx"]
---

# Surface: App shell + Login

Scope: authenticated app shell (sidebar, header, page frame) shared by every module, plus the Login route. Mode: Operate.
Audience/job: internal ops team switching across many M365 tenants daily; find a task fast, never doubt the active tenant.
Constraints: no mock data, every view has loading/empty/error states; credential string never persisted; light AND dark themes required (user request).

## Direction contract

THESIS: The sidebar is the building's tenant board, so the active tenant reads like the name in a lobby directory. Refuses the default white Fluent rail with a blue pill.
OWN-WORLD: Grooved felt-black rail (#1c1d1f) with white pressed-in condensed caps (Archivo Narrow), brass frame accent (#b48a3c), group colour ticks. Work area: warm grey paper (#eceae4) in light, graphite (#18191b) in dark; the rail stays felt in both. Square 4px corners, 1px rules, tabular figures.
STORY: The operator signs in with one credential string, lands on the dashboard, reads the tenant on the board, then jumps to a task from grouped nav or Ctrl K.
FIRST VIEWPORT: 264px felt rail, brand, brass-framed "NOW IN TENANT" board, grouped nav with colour ticks; 60px header with condensed uppercase page title, API status, search, theme toggle; work area with one fixed page frame. Login: felt board panel centred, single credential input, primary Sign in.
FORM: Lobby letterboard, candidate 6 of 7, seed: none (unavailable). Signature move: tenant name presses in letter by letter on sign-in. Raises: group colour ticks (transit); bulk results hold until acknowledged (gate board); one fixed page header frame (folio).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
