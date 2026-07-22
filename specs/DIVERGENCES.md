# Spec ↔ code divergence audit — second edition

- Date: 2026-07-19. Supersedes the 2026-07-18 edition.
- Method: six parallel auditors —
  five walking every claim of every spec file of the reworked tree
  against code, catalogues and services, one auditing **structure**
  (the `shared/` base-template abstraction versus the component
  architecture) — then an adversarial verification pass
  (15 of 15 top findings confirmed)
  and a fresh-eyes self-review of the tree itself
  (fixes landed on `docs/behaviour-specs`).

## 1. Implementation queue

One ordered backlog. `specs/README.md` points here.

### Structural — make the code mirror the spec abstractions

Each `shared/` base spec should have one generic code counterpart,
specialised per entity, as the specs are.

1. **One linking resolver** (`shared/linking.spec.md` — *missing*):
   `entityPath(kind, id)` / `resolveReference`, adopted by
   audit entities, mentions, global search, transaction concepts
   and every table cell.
   Kills 41 hardcoded `/{entity}/${id}` strings across 21 files
   and three verified behaviour bugs:
   piece search results miss the `#piece-‹id›` anchor
   (`globalSearch.ts:138`),
   income audit rows never link their job
   (`auditEntityResolver.ts:88-92`),
   transaction search lands on the list, not the row's page.
2. **Generic list-page shell + `useListSearch`**
   (`shared/list.spec.md` — *partial*):
   the query/fuzzy-filter/empty-state/lifecycle harness is
   hand-assembled in all five list controllers;
   fold it into one shell that also carries
   the archived-struck-through rows and the header row.
3. **One dropdown** (`shared/dropdown.spec.md` — *partial*):
   `Combobox` gains the shared fuzzy matcher and multiselect;
   migrate the three native `Select` sites
   (note severity ×2, audit filters ×2, purchase category),
   the kanban card's `sr-only` select, and delete dead
   `FormSelect.tsx`; entity options render "‹id› — ‹name›".
4. **Widgets unification** (`shared/widgets.spec.md` — *missing
   beyond jobs*): three parallel systems today
   (jobs `WidgetGrid`, client `StatCard`s,
   the `<dl>` field list in `EntityDetailPage`).
   The shell renders one widget grid with the five kinds;
   `JobDetailPage` adopts the shell it currently bypasses.
5. **Material-cost and benefit as one pricing service**
   (`shared/pricing.spec.md` — *partial*):
   re-derived four times
   (`JobWidgetGrid`, `JobMaterialsSummary`,
   `clientMetrics.materialsEstimate`, dashboard/kanban benefit).
6. **Shared lifecycle UI** (`shared/lifecycle.spec.md` — *partial*):
   a `useEntityLifecycle` gate deriving read-only state and the
   action set, one struck-row helper for tables;
   fixes a verified bug — an **archived** inventory item renders
   not-found instead of a frozen page with Un-archive/Delete —
   and extends the cascade helper beyond client|job.
7. **DataTable column model** (`shared/table.spec.md` — *partial*):
   columns declare their viewport tier; sort and the quiet empty
   row become central; `PieceItemsTable` (a plain `<table>`),
   `AuditTable` and the lots/consumption tables come aboard.
8. **Entity-generic notes and tags**
   (`shared/notes|tags.spec.md` — *partial*):
   label namespace and cascade derive from `entityType`
   instead of the hardcoded client|job ternary.
9. **The wizards adopt the dialog shell**
   (`shared/dialogs.spec.md` — *partial*):
   `MigrationWizardModal` and `SetupWizard` roll bespoke overlays.

### Functional — new this audit, all verified

10. **Expense save is not atomic** (`expense-details.spec.md`):
    the amount persists before lots are validated, so an invalid
    lot draft aborts *after* the amount saved; per-lot errors do
    not disable Save (`ExpenseTransactionDetailPage.tsx:135-155`).
11. **"Pieces completed (7 days)" counts creation, not completion**
    (`dashboard/stats.spec.md`): `Piece` has no completion
    timestamp; the window filters `createdAt`
    (`dashboardStats.ts:25-31`). Needs a done-at timestamp.
12. **Empty and zero thresholds are indistinguishable**
    (`inventory/details/details.spec.md`): the entity stores both
    as `0` and `> 0` guards every tier — "empty is off, zero is
    a real level" needs the data model to tell them apart
    (`InventoryItem.ts:29-43`).
13. **Breadcrumbs never name things; the root shows a trail**
    (`navigation.spec.md`): detail crumbs are raw ids by design,
    and `/dashboard` renders "Home / Dashboard"
    (`BreadcrumbBar.tsx:28-34`).
14. **The saving overlay speaks schema** (`saving/saving.spec.md`):
    raw sheet names ("crm_notes") render;
    `workbook.savingSheet`/`loadingSheet` keys exist unused
    (`BlockingOverlay.tsx:32-34`).
15. **Global search misses two promises** (`search.spec.md`):
    Escape closes without clearing the box
    (`GlobalSearchBox.tsx:39-43`);
    the piece anchor is item 1's resolver.
16. **Overall risk mislabels and never names**
    (`materials-summary.spec.md`): every band renders the
    "Safe (‹n› redos)" string — red "Safe (0 redos)" — and the
    worst material goes unnamed (`JobMaterialsSummary.tsx:185-187`);
    its Inventory cells are plain text, not links (`:154`).
17. **Lots render oldest-first; consumption column order reversed**
    (`inventory/details/*.spec.md`): no newest-first sort
    (`LotRepository.ts:14-16`); consumption renders
    Qty–Piece–Job against the spec's Job–Piece–Qty
    (`InventoryConsumptionTable.tsx:42-46`;
    its missing Cost column is already carried below).
18. **Client page leaks empty rows; address is single-line**
    (`clients/*`): email/phone render unfilled
    (`ClientDetailPage.tsx:87-89`);
    the Address field is a `FormInput`, not a textarea
    (`CreateClientDialog.tsx:137`).
19. **Copy fixes**: the job-archive confirmation omits material
    lines from its sentence; the inventory stock header reads
    "Qty (current)" against the spec's "Current stock";
    the expected-benefit empty copy still says
    "draft or in-progress" against the
    neither-paid-nor-cancelled rule;
    the no-lines suggested price offers "Use €0.00 / unit";
    only a kanban card's description is clickable.

### Carried from the tracker, still queued

The `specs/README.md` deviations list remains authoritative for:
quiet empty rows everywhere; archived rows visible struck-through;
repository-filtered deletes, causation cascade, kind-only delete
entries; the inventory page's three save buttons, read-only lots
and consumption Cost; calendar counts and chips; the remembered
dashboard switcher; notes/tags for every entity (dbml widens);
the metadata door enabled; money at zero green; one fuzzy matcher.

## 2. Rulings needed

1. Calendar "Today" control — the spec says it, the code has
   only ‹ › navigation. Add it, or drop the claim?
2. A kanban card with incomplete pricing still shows its benefit
   beside the marker — "instead" or "alongside"?
3. Archived pieces still feed expected benefit (only deleted are
   filtered) — should the estimate exclude them?
4. The client "Jobs" widget counts active jobs only — spec says
   "in any state"; should archived count?
5. "Materials (estimate)" counts failed prints too
   (consuming = done or failed) — reword the spec to "made"?
6. Money-figure scope: `widgets.spec.md` gates *every* money
   figure on incomplete pricing; `pricing.spec.md` scopes the
   gate to totals; the Material cost widget never gates.
   Which reading wins?
7. The header shows a bare wordmark when a shop has no logo —
   the spec promises the app's own mark as fallback.
8. A Google-session save error shows no Retry (recovery via the
   sign-in banner) — is the banner the intended answer?
9. Create dialogs surface one validation error at a time —
   per-field errors instead?

## 3. Audited clean

`welcome/` (all three), `migration/` (all three, step cards
included), `profile`, `not-found`, `metadata`,
`transactions/create` and `transactions/list`,
the audit page's badges/actors/parent attribution,
tags dedup and tooltips, notes severity strips,
all four job status dialogs and both piece scenarios verbatim,
widget order and editability, pricing core, redo bands,
kanban gates and retire rule, calendar maths,
and every quoted string checked this round.

## 4. Implemented, pending merge

On `feat/spec-divergences-implementation` (verified present):
the in-memory migration with Confirm and close (ADR-0012),
the sign-out unsaved-changes confirmation,
and the hop-aware wizard explanation
(mainline still hardcodes the v1→v2 copy).

## 5. Method notes

- Verification: 15 of 15 spot-checked findings confirmed.
- Self-review of the tree: 11 fixes applied on
  `docs/behaviour-specs`; two apparent inconsistencies were
  confirmed faithful to the catalogue
  (curly quotes in the inventory empty string;
  full-stop placement follows each string exactly).
