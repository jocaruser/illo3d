# Behaviour specs

This tree is the canonical, non-technical record of what illo3d does,
organised by what a user navigates.
The format is decided in
[ADR-0008](decisions/ADR-0008-page-focused-behaviour-specs.md)
(page-focused files, hybrid voice, user-observable scope,
identity openers, shared mechanics, quoted meaningful copy),
written under
[ADR-0009](decisions/ADR-0009-semantic-line-breaks.md) (semantic line breaks)
and [ADR-0010](decisions/ADR-0010-british-english.md) (British English).

Until this migration completes,
`openspec/specs/` remains the frozen v2 record —
do not update it; it is history.

## How this migration works

One page (or loose surface) at a time:

1. a question round settles intent, edge cases and blind spots
   (fix-the-app-first when the spec would otherwise record a wrong truth);
2. files are drafted and confirmed one by one;
3. each confirmed page folder is committed.

Where Carlos has declared intent that the code does not yet implement,
the spec records the intent and the gap is listed below —
specs lead, code follows.

## Review round — 2026-07-18

Carlos reviewed the tree up to `inventory/` (36 comments);
the rulings below were confirmed in session
and are being applied across every file, reviewed or not.

Rulings now in force:

- **`shared/` grows**: `table` (headers always; one quiet
  saying-so row when empty), `details` (the details-page shell,
  including *no page-local save buttons*), `linking`
  (what resolves to what), and the parked `timeline`;
  notes and tags open to every entity.
- **Identity openers**: every file starts by placing itself —
  a page with its address, or a section with its parent;
  details folders' main file is `details.spec.md`
  (ADR-0008 amendment).
  What a page loads may anchor to its `schema.dbml` table.
- **Archive freezes; delete never happened**:
  archived is visible everywhere, struck through, read-only,
  money unchanged, out of open-work surfaces only;
  deleted is repository-filtered, cascades along causation
  (a job's income dies with it), leaves no dangling reference,
  and is remembered only by the audit log, by kind, never by name —
  [ADR-0014](decisions/ADR-0014-archive-then-delete-lifecycle.md)
  rewritten, [ADR-0016](decisions/ADR-0016-repositories-filter-deleted.md)
  new.
- **Search speaks only in `search.spec.md`** —
  other files stop mentioning it.
- **ADR-0015 dissolves into specs** (pending, in the sweep).
- **Parked for full respecs**: the kanban (pieces, not jobs)
  and the timeline (shared, most entities).
- **Base templates with specialisation slots** (second pass):
  `shared/list.spec.md` and `shared/details.spec.md`
  are default specs that name their blanks,
  never naming entities;
  a page file opens with the formula —
  lives at, follows, title, columns, departures.
  Each Add button points at the entity's own `create.spec.md`
  (files come with the sweep);
  list tables end in an Edit / Archive Actions column
  unless the page says otherwise;
  details pages carry the responsive widgets grid.
- **Third pass**: the search box is its own shared spec,
  and fuzzy matching is decided once for every search
  ([ADR-0017](decisions/ADR-0017-fuzzy-matching-in-every-search.md));
  sorting belongs to every table (`shared/table.spec.md`);
  rows usually open their details page, nothing enforced;
  list pages carry breadcrumbs;
  widgets get their own base spec —
  five kinds: text, number, money, date, choice —
  and each details page's widgets spec
  declares order, kind and in-place edits;
  base templates never cite an entity's spec as a model.
- **Fifth pass**: one generic dropdown for the whole app
  (`shared/dropdown.spec.md`) — three modes
  (plain, searchable, creatable), fuzzy per ADR-0017;
  decided over the two-picker alternative
  after the interactive consolidation report.
- **Fourth pass**: widget kinds carry their behaviour —
  an editable date opens the browser's built-in calendar picker,
  money is green at zero or above and red below,
  only text can link;
  the table base names the questions every use answers —
  columns and order, empty wording,
  and per-viewport columns as a Viewport column
  of the columns table
  (the identifier always remains; actions may hide).

Sample built for sign-off:
`shared/`, the two ADRs, the `inventory/` branch,
and `ui/style-guide.md`.
The sweep of everything else awaits that sign-off:

- [ ] `dashboard/` — calendar counts and bare empty grid,
      remembered view choice, not-paid-nor-cancelled figures,
      no-breadcrumbs line, kanban park banner
- [ ] `jobs/` and `clients/` — openers, shell references,
      the specialisation formula, their `create.spec.md` files;
      the jobs widgets spec declares order and kinds
- [ ] `search.spec.md` and the tags box — reference
      [ADR-0017](decisions/ADR-0017-fuzzy-matching-in-every-search.md)
      and `shared/search-box.spec.md`
- [ ] `transactions/` and `audit-log/` — openers, linking references,
      type-only delete entries
- [ ] `welcome/`, `migration/`, loose root files — openers
- [ ] `shared/dialogs.spec.md` — creation/edit dialog mechanics
      backing each entity's `create.spec.md`
      (side-panel respec expected later)
- [ ] ADR-0015 → a shared pricing spec
- [ ] delete `specs/features/` (its redirect folds in here)

## Checklist

Every surface and page is drafted.

Reviewed and confirmed in session:

- [x] `welcome/` — welcome, local-folder, google-drive
- [x] `migration/` — wizard, v1-to-v2, v2-to-v3
- [x] `navigation.spec.md`, `saving.spec.md`, `not-found.spec.md`
  (committed with the merge; content amendable)
- [x] review round one — rulings above; `shared/`, decisions,
  `inventory/`, `ui/style-guide.md` corrected as the sample

Self-directed, awaiting Carlos's review:

- [x] `search.spec.md`, `profile.spec.md`, `entities/metadata.spec.md`
- [x] `dashboard/` — overview, stats, kanban, calendar, stock-alerts,
  recent-transactions
- [x] `shared/` — notes, tags, lists, lifecycle, table, details,
  linking, timeline (page-agnostic mechanics)
- [x] `jobs/` — list; details: overview, widgets
  (owns totals, due colours, paid dialogs), pieces-table (owns consumption),
  materials-summary
- [x] `clients/` — list; details: overview, metrics, jobs-table
- [x] `inventory/` — list; details: details, lots, consumption
- [x] `transactions/` — list, purchase, expense-details
- [x] `audit-log/audit-log.spec.md`
- [x] ADR-0014 (archive/delete), ADR-0015 (derived pricing,
  income on paid — dissolving), ADR-0016 (repository filtering)

## Questions for review

1. ~~Notes and tags ownership~~ — resolved by Carlos's shared-folder
   decision: page-agnostic mechanics now live in `specs/shared/`
   and pages link to them.
2. ~~How-lists-behave owner~~ — same resolution: `shared/list.spec.md`.
3. Sign-out discards unsaved changes without the confirmation Refresh asks
   for — specced as truth in `profile.spec.md`; fix queued as a task. Fix it?
4. Two backend-inappropriate strings were fixed to spec them honestly:
   the structure error ("Google Sheet" → "files") and the transactions empty
   state ("Add data in Google Sheets." → how transactions are actually
   created). Review the new wording.
5. American spellings remain in pre-ADR-0010 ADRs and framework-generated
   files per adoption-on-next-edit.
6. `FRAMEWORK.local.md` still names `openspec/specs/` as canonical;
   flip it to this tree after review? The fate of `openspec/` stays open.

## Spec-led deviations awaiting implementation

The spec is the contract; these are the known places the code lags it.

From the first drafting pass:

- **In-memory migration with Confirm and close**
  ([ADR-0012](decisions/ADR-0012-in-memory-migration-with-explicit-submit.md),
  `migration/wizard.spec.md`):
  implemented on `feat/spec-divergences-implementation`,
  pending merge.
- **Damaged-metadata overwrite guard**
  (`welcome/local-folder.spec.md`):
  a real shop with a corrupt metadata file gets the "create new shop" offer,
  and confirming overwrites it; wants a defensive check.
- **Sign-out discards unsaved edits without confirming**
  (`profile.spec.md`):
  implemented on `feat/spec-divergences-implementation`, pending merge.
- **Local re-permission on reopen**
  (`welcome/local-folder.spec.md`):
  "the browser may first ask you to re-allow access" is unverified;
  check the lapsed-permission path, likely add a friendly re-allow prompt.

New from the review round (2026-07-18):

- **Empty tables render headers plus one quiet row** everywhere —
  several tables today vanish entirely or show a bare phrase.
- **Archived rows visible struck-through in top-level lists** —
  today they are filtered out of lists;
  archived pieces/jobs also need the read-only styling
  and per-row Un-archive in embedded tables.
- **Repository-level deleted filtering** (ADR-0016) —
  and delete must cascade along causation:
  a job's income transactions, a material's piece lines and lots.
  No undelete anywhere;
  audit delete entries name the kind only, never the name.
- **Inventory details** — the three page-local save buttons go
  (the header's Save is the only one);
  lots become read-only (corrections only via the purchase page);
  consumption gains its Cost column
  (qty × average purchase price).
- **Thresholds: empty = off** — zero becomes a real level;
  today off is expressed as zero.
- **Calendar** — previous/next month buttons carry "(N jobs)",
  job chips end with "(N pieces)",
  an empty month renders the bare grid with no phrase.
- **Dashboard** remembers the Kanban/Calendar choice
  across refreshes.
- **Notes and tags for every entity** —
  `schema.dbml`'s `entity_type` annotations
  ("client | job") widen with it.
- **Metadata editing** — `entities/metadata.spec.md` gains the
  profile menu's "Edit metadata.json" entry (today visibly disabled).
- **List pages converge on the shared header row** —
  title, search, optional Add — and the default Actions column;
  **details pages converge on the widgets grid**
  (the material page's form fields become widgets).
- **One generic dropdown replaces the four pickers**
  (`shared/dropdown.spec.md`) —
  `Select`, dead `FormSelect`, `Combobox`
  and the kanban card's hidden select all converge on it;
  every call site migrates,
  and its searchable mode uses the shared fuzzy matcher.
- **Money at zero renders green** —
  `ColouredNumber` currently mutes zero;
  align it when money colouring becomes one shared rule
  (the ADR-0015 dissolution).
- **One shared fuzzy matcher behind every search**
  ([ADR-0017](decisions/ADR-0017-fuzzy-matching-in-every-search.md)) —
  the global search and the tag box
  need verifying against it and aligning.

## When the migration completes

Point `FRAMEWORK.local.md`'s specification-location note at this tree,
decide the fate of `openspec/`,
and fold this checklist away.
