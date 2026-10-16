---
version: 1
slug: "src-app-appshell-tsx"
primary_target: "src/app/AppShell.tsx"
related_targets: ["src/features/auth/LoginPage.tsx"]
---

# Surface: App shell + Login

Scope: authenticated app shell (sidebar, header, page frame) shared by every module, plus the Login route. Mode: Operate.
Audience/job: internal ops team switching across many M365 tenants daily; find a task fast, never doubt the active tenant.
Constraints: no mock data, every view has loading/empty/error states; credential string never persisted; light AND dark themes required.

## Direction contract

THESIS: M365 Admin is Family Photos' sibling: the same navy cover and coral ribbon, put to work on tenant administration. User-pinned after rejecting the rolled directions (Lobby Directory, Cobalt demo).
OWN-WORLD: Family Photos tokens verbatim: white paper / navy-at-night grounds, blue-violet ink, coral as the only accent, navy vinyl sidebar. Bricolage Grotesque display, Be Vietnam Pro text, pill buttons, 6px paper radius, soft paper shadow. Gear "A" logo.
STORY: Operator pastes one credential, lands in the console, reads the active tenant card at the top of the sidebar, jumps to a tool from grouped nav or Ctrl K.
FIRST VIEWPORT: Login: vinyl cover 5/12 (logo, three workspace cards fanned with real tool names, one line of copy), form 7/12 (credential field with morphing eye, coral pill Sign in). Shell: 272px vinyl sidebar (collapsible to 76px rail, Ctrl B), tenant card, grouped nav with coral ribbon; 64px header with group + page title, API status, search.
FORM: Brief-pinned (sibling product system), seed: none (unavailable). Signature move: the coral ribbon gliding between nav items.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
