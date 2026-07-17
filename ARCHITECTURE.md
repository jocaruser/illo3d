# illo3d v3 — Architecture

This document is the map of the v3 rewrite: a ground-up reimplementation preserving the v2
product intent and feature set, completing the two abandoned v2 work streams (audit logging
and the v2 data-model ideas), and organized along **Symfony conventions**.

The *why* behind each load-bearing choice lives in the ADRs under
[`specs/decisions/`](specs/decisions/):

| ADR | Decision |
|---|---|
| [ADR-0001](specs/decisions/ADR-0001-symfony-style-architecture.md) | Symfony-style layout; entity classes, repositories with two backends, EntityManager |
| [ADR-0002](specs/decisions/ADR-0002-workbook-snapshot-unit-of-work.md) | In-memory workbook snapshot with explicit Save |
| [ADR-0003](specs/decisions/ADR-0003-client-side-persistence.md) | Memory-only token; shop in localStorage; handle in IndexedDB |
| [ADR-0004](specs/decisions/ADR-0004-additive-schema-and-migration-wizard.md) | Additive-only schema evolution behind the migration wizard |
| [ADR-0005](specs/decisions/ADR-0005-audit-logging-at-repository-layer.md) | Audit logging at the repository layer |
| [ADR-0006](specs/decisions/ADR-0006-job-based-hybrid-kanban.md) | Job-based hybrid kanban, not piece-based |
| [ADR-0007](specs/decisions/ADR-0007-github-pages-platform.md) | GitHub Pages platform and everything it forces |

Feature scope in one line: clients, jobs (kanban + calendar), pieces with BOM lines and
inventory consumption, inventory with purchase lots/thresholds/colours, transactions and the
purchase flow, tags, CRM notes with @mentions, global fuzzy search, dashboard KPIs, audit log,
migration wizard, Google Drive and Local CSV backends, EN/ES i18n, dark theme, responsive
layout, 100% coverage thresholds enforced by `make test`.

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

## Platform constraints and persistence

The app ships as a static bundle on GitHub Pages — no server at runtime, ever. HashRouter,
the `/illo3d/` base path, meta-tag CSP (theme init from the bundle; no `'unsafe-inline'`),
and build-time-only secrets all follow from that: see
[ADR-0007](specs/decisions/ADR-0007-github-pages-platform.md).

Browser persistence is decided per kind of state — Google access token in memory only, active
shop and backend choice in `localStorage`, the directory handle in IndexedDB, preferences in
`localStorage`: see [ADR-0003](specs/decisions/ADR-0003-client-side-persistence.md).
