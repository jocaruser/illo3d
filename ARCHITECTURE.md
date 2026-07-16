# illo3d v3 — Architecture

This document describes the ground-up rewrite of illo3d (the "v3 rewrite"). It preserves the
product intent and feature set of the v2 app, completes the two abandoned v2 work streams
(audit logging and the v2 data-model ideas), and reorganizes the codebase along **Symfony
conventions** so backend developers feel at home.

## Goals

1. **Same product, cleaner skeleton.** Every feature of the v2 app is preserved: clients, jobs
   (kanban + statuses), pieces with BOM lines and inventory consumption, inventory with
   purchase lots and thresholds, transactions with the purchase flow, tags, CRM notes with
   @mentions, global fuzzy search, dashboard KPIs, Google Drive/Sheets and Local CSV backends,
   EN/ES i18n, dark theme, responsive layout.
2. **Finish the audit log** (the unfinished v2 work): every domain mutation now writes an
   `audit_log` row (full before/after snapshots + `fieldsChanged`), and the Audit Log page
   displays them. Notes and tag links stay first-class sheets (main-spec flavor, not the
   abandoned event-sourcing flavor).
3. **Adopt the v2-data-model intent with minimal schema change**: jobs gain `due_date`
   (nullable, drives a new **calendar view** and the due-date badges), inventory gains
   `colour` (nullable, filament swatches). Jobs keep their status enum and job-based kanban —
   the abandoned branch's own retrospective (`KANBAN_FEATURE_ANALYSIS.md`) concluded the
   piece-based kanban regressed UX; we adopt its recommended hybrid: job cards show piece
   progress.
4. **Built-in migration wizard**: fully functional (the v2 modal had a dead Continue button).
   Declarative plans (`V1ToV2`, `V2ToV3`) chained by a registry, executed against an isolated
   working copy with an optional backup and an atomic metadata-version commit. Live per-entity
   progress in the wizard grid.
5. **Perfect code coverage**: Vitest coverage thresholds are set to 100% and enforced by
   `make test`.

## Schema v3

`illo3d.metadata.json` major version **3**; `APP_VERSION = 3.0.0`.

Changes vs v2 are strictly additive, appended at the end of header rows so migration can map
columns by position (stored header must be a prefix of the canonical header):

| Sheet       | Change                          |
|-------------|---------------------------------|
| `jobs`      | + `due_date` (nullable ISO day) |
| `inventory` | + `colour` (nullable `#RRGGBB`) |

Everything else is unchanged from v2 (11 sheets including `audit_log`). `schema.dbml` is the
authoritative diagram and is updated in the same PR.

Migration chain: a v1 shop runs `V1ToV2` (add `archived`/`deleted` lifecycle columns,
create `audit_log`, backfill one `migration` audit entry per existing row) then `V2ToV3`
(append `jobs.due_date` and `inventory.colour`). A v2 shop runs only `V2ToV3`.

## Directory layout (Symfony-style)

```
translations/            # messages catalogs, Symfony-style root dir (en.json, es.json)
src/
  main.tsx               # entry point (think public/index.php)
  Kernel.tsx             # app shell: providers, router, layout (think src/Kernel.php)
  Config/                # version.ts, schema.ts (SHEET_NAMES/HEADERS), routes.tsx
  Entity/                # real entity classes: Client, Job, Piece, PieceItem, InventoryItem,
                         # Lot, Transaction, Tag, TagLink, CrmNote, AuditEntry, Shop, ShopMetadata
                         # each maps itself to/from sheet rows (fromRow / toRow), owns its
                         # invariants (isActive(), isArchived(), Job.isCompleted(), ...)
  Repository/            # data access
    WorkbookRepositoryInterface.ts   # readSheetMatrix / replaceSheetMatrix / createWorkbook / ...
    FolderRepositoryInterface.ts     # readMetadata / writeMetadata / getFolderName / ...
    LocalCsv/                        # File System Access API implementation (CSV per sheet)
    GSheet/                          # Google Sheets + Drive implementation (OAuth, 401 renew+retry)
    RepositoryFactory.ts             # backend-driven selection (local-csv | google-drive)
    ClientRepository.ts, JobRepository.ts, ...  # typed per-entity repositories over the
                         # in-memory workbook snapshot (find / findAll / findActive / persist)
  Service/               # domain services (constructor-injected repositories, pure logic)
    WorkbookService.ts   # unit of work: hydrate / refresh / save whole workbook
    AuditLogger.ts       # appends audit_log entries (before/after JSON, fieldsChanged, actor,
                         # parent entity for cascades) — invoked by every mutating service
    LifecycleService.ts  # archive / soft-delete / restore with cascades
    JobService, PieceService, PurchaseService, InventoryService, TransactionService,
    TagService, NoteService, ClientService, ShopProvisioningService, ShopValidationService
    Pricing/             # money math: job pricing, avg unit cost, suggested price, redos,
                         # expected benefit, dashboard stats, client metrics
    Search/              # global fuzzy search (fuse.js) over the snapshot
  Migration/             # the migration wizard engine (think Doctrine migrations)
    MigrationPlan.ts, MigrationStep.ts, MigrationContext.ts, orchestrator.ts, registry.ts
    Target/              # LocalCsvMigrationTarget, GSheetMigrationTarget (working copy +
                         # optional backup + atomic metadata commit)
    Plan/V1ToV2/, Plan/V2ToV3/
  Security/              # Google OAuth (token store, silent renewal, authorized fetch),
                         # local synthetic user
  Store/                 # Zustand stores: workbook (matrices, dirty, status), shop, backend,
                         # auth, userPreferences (language/theme), operation (toasts/overlay),
                         # migration (wizard progress)
  Controller/            # route-level React components (one per route, think controllers)
  Component/             # shared UI (layout/, table/, form/, dialog/, kanban/, calendar/,
                         # wizard/, dashboard/, audit/)
  Theme/                 # theme init + design tokens (CSS custom properties, dark class)
tests/
  Unit/                  # Vitest tests mirroring src/ (Symfony tests/ convention)
  e2e/                   # Playwright end-to-end suites
fixtures/                # golden CSV shop scenarios (v3), incl. pre-v2-upgrade (v1.5) and
                         # pre-v3-upgrade (v2.0) migration scenarios
```

## Key mechanics

- **Workbook snapshot**: the whole workbook is hydrated into the `workbookStore` on shop open;
  all reads come from the snapshot; every mutation is in-memory and marks the store dirty;
  explicit **Save** writes all sheets back through the active `WorkbookRepositoryInterface`
  implementation. Refresh re-reads (confirming first when dirty).
- **Audit**: mutating services never touch matrices directly; they go through their entity
  repository and call `AuditLogger` with the before/after entities. The logger computes
  `fieldsChanged`, serializes snapshots, resolves the actor (Google email or `local`), tracks
  the parent entity during cascades, and appends to the `audit_log` tab (which is saved like
  any other sheet). `audit_log` rows are immutable and carry no lifecycle columns.
- **Migration**: on shop open, a metadata major-version mismatch opens the Migration Wizard.
  The registry resolves a chain of plans from the shop's major to the app's major. Each plan is
  an ordered list of idempotent steps executed against a **working copy** (sibling folder for
  Local CSV, spreadsheet copy for Drive). The user chooses whether to keep a backup. The
  version flip in `illo3d.metadata.json` is the last, atomic commit — a failed run leaves the
  original shop untouched. Progress is streamed to the wizard's step grid via the
  `migrationStore`.
- **i18n**: same English/Spanish catalogs as v2 (carried over verbatim), new keys added in both
  languages. Language and theme persist in `userPreferencesStore`.
- **Theme**: class-based dark mode with CSS custom-property tokens; initialized before React
  mounts to avoid flash.

## Platform constraint: GitHub Pages

The app ships as a **static bundle on GitHub Pages** (`.github/workflows/deploy.yml`, on push to
`main`). There is no server at runtime, ever. This is the hard constraint; the rules below are
the things that follow from it and therefore cannot change. See
`openspec/specs/github-pages-deployment/spec.md` and `openspec/specs/security-headers/spec.md`.

- **HashRouter, not BrowserRouter.** A static host serves no rewrite rules, so deep links must
  live in the fragment: `/#/clients/CL1`. `src/Config/routes.tsx` wires the hash router and
  nothing may switch to history-based routing.
- **Base path `/illo3d/` in production** (`/` in dev) via `vite.config.ts` `base`, so assets
  resolve under the repo subpath.
- **No backend and no server-side secrets.** `VITE_GOOGLE_CLIENT_ID` is injected at build time
  from repo secrets. The Vite plugins that serve and write fixture CSVs are dev/e2e-only and must
  never become a production dependency — the Local CSV backend writes through the File System
  Access API directly, and the Google backend talks to the Sheets/Drive APIs from the browser.
- **CSP and security headers live in `index.html` meta tags**, because there is no server to send
  real headers: script/connect allowlists for Google Identity and the Sheets/Drive APIs,
  `frame-ancestors 'none'`, `referrer strict-origin-when-cross-origin`, `nosniff`, and a
  restrictive `Permissions-Policy`. Theme init therefore runs from the bundle rather than an
  inline `<script>`, so `script-src` needs no `'unsafe-inline'`.

## Client-side persistence (a design decision, not a platform constraint)

Static hosting says *where* state may live (the browser) but not *which* browser store. v2 put
OAuth credentials and the active shop in `sessionStorage`, which meant every new tab dropped the
user back at the setup wizard. v3 makes a deliberate choice per kind of state:

| State | Store | Why |
|---|---|---|
| Google access token | **memory only** | A token in `localStorage` is readable by any XSS and outlives the tab for no benefit: the GIS token client already renews silently, so a reload simply re-acquires one. Never persisted. |
| Active shop, backend choice | **`localStorage`** | Not secret (a folder id and a spreadsheet id). Persisting them lets a returning user land straight in their shop instead of re-running the wizard — the v2 behaviour users felt as friction. |
| Local CSV directory handle | **IndexedDB** | The only store that can hold a `FileSystemDirectoryHandle`; re-permissioned on use. |
| Language, theme | **`localStorage`** | Preferences, unchanged from v2. |

Consequence: opening a shop is idempotent across reloads and tabs, and signing out is an
explicit act that clears the persisted shop rather than a side effect of closing a tab.
