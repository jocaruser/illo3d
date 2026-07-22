# Behaviour specs

This tree is the canonical, non-technical record of what illo3d does,
organised by what a user navigates.
The format is decided in
[ADR-0014](ADRs/ADR-0014-page-focused-behaviour-specs.md)
(page-focused files, hybrid voice, user-observable scope,
identity openers, shared mechanics, quoted meaningful copy),
written under
[ADR-0015](ADRs/ADR-0015-semantic-line-breaks.md) (semantic line breaks)
and [ADR-0016](ADRs/ADR-0016-british-english.md) (British English).

There is no `specs/features/` capability layout:
where framework rules speak of one,
this tree is the target
(`FRAMEWORK.local.md` carries the override).

The canonical database model lives separately in
[`specs/technical/database-model/schema.dbml`](technical/database-model/schema.dbml)
with supporting context in
[`specs/technical/database-model/spec.md`](technical/database-model/spec.md)
(per [ADR-0002](ADRs/ADR-0002-local-csv-or-google-drive.md)).

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
  (ADR-0014 amendment).
  What a page loads may anchor to its `schema.dbml` table.
- **Archive freezes; delete never happened**:
  archived is visible everywhere, struck through, read-only,
  money unchanged, out of open-work surfaces only;
  deleted is repository-filtered, cascades along causation
  (a job's income dies with it), leaves no dangling reference,
  and is remembered only by the audit log, by kind, never by name —
  [ADR-0011](ADRs/ADR-0011-archive-then-delete-lifecycle.md)
  rewritten, [ADR-0012](ADRs/ADR-0012-repositories-filter-deleted.md)
  new.
- **Search speaks only where it's owned** —
  the generic mechanics in `shared/search.spec.md`,
  the global search's own facts in `topnavbar/navbar.spec.md`
  (dissolved from the standalone `search.spec.md`);
  other files stop mentioning it.
- **The pricing spec dissolved into `shared/pricing.spec.md`**.
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
  ([ADR-0013](ADRs/ADR-0013-fuzzy-matching-in-every-search.md));
  sorting belongs to every table (`shared/table.spec.md`);
  rows usually open their details page, nothing enforced;
  list pages carry breadcrumbs;
  widgets get their own base spec —
  five kinds: text, number, money, date, choice —
  and each details page's widgets spec
  declares order, kind and in-place edits;
  base templates never cite an entity's spec as a model.
- **Fifth pass**: one generic dropdown for the whole app
  (`shared/dropdown.spec.md`) — always searchable (the default mode),
  creatable adds the Create row, a multiselect parameter,
  entity options as "‹id› — ‹name›", fuzzy per ADR-0013,
  and every use declares its label;
  decided over the two-picker alternative
  after the interactive consolidation report.
  Status selectors — a job's, a piece's — are dropdown uses;
  archive and delete stay plain actions.
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
The sweep is applied — every file conforms:

- [x] `dashboard/` — calendar counts and bare empty grid,
      remembered view choice, not-paid-nor-cancelled figures,
      no-breadcrumbs line, kanban park banner
- [x] `jobs/` and `clients/` — the specialisation formula,
      `create.spec.md` files, widgets with kind and order
      (client metrics renamed `widgets.spec.md`),
      Viewport columns from code truth
- [x] `shared/search.spec.md` (new) and `topnavbar/navbar.spec.md`'s
      Search section — ADR-0013 and the dropdown's keys
- [x] `transactions/` (purchase renamed `create.spec.md`)
      and `audit-log/` — the formula, linking references,
      type-only delete entries
- [x] `welcome/`, `migration/`, loose root files — openers
- [x] `shared/dialogs.spec.md` — the one shell
      (side-panel respec expected later)
- [x] Pricing spec → `shared/pricing.spec.md`
- [x] delete `specs/features/` and the `ui/` scaffolding —
      redirects folded in here and into `FRAMEWORK.local.md`

## Checklist

Every surface and page is drafted.

Reviewed and confirmed in session:

- [x] `welcome/` — welcome, local-folder, google-drive
- [x] `migration/` — wizard, v1-to-v2, v2-to-v3
- [x] `topnavbar/navbar.spec.md`, `saving/`, `not-found.spec.md`
  (committed with the merge; content amendable)
- [x] review round one — rulings above; `shared/`, decisions,
  `inventory/`, `ui/style-guide.md` corrected as the sample

Self-directed, awaiting Carlos's review:

- [x] `topnavbar/` (navbar, profile, breadcrumbs, search),
  `shared/search.spec.md`, `entities/metadata.spec.md`
- [x] `dashboard/` — overview, stats, kanban, calendar, stock-alerts,
  recent-transactions
- [x] `shared/` — notes, tags, lists, lifecycle, table, details,
  linking, timeline (page-agnostic mechanics)
- [x] `jobs/` — list; details: overview, widgets
  (owns totals, due colours, paid dialogs), pieces-table (owns consumption),
  materials-summary
- [x] `clients/` — list; details: overview, widgets, jobs-table
- [x] `inventory/` — list; details: details, lots, consumption
- [x] `transactions/` — list, purchase, expense-details
- [x] `audit-log/audit-log.spec.md`
- [x] ADR-0011 (archive/delete), ADR-0012 (repository filtering),
  `shared/pricing.spec.md` (absorbed the pricing spec)

## Questions for review

1. ~~Notes and tags ownership~~ — resolved by Carlos's shared-folder
   decision: page-agnostic mechanics now live in `specs/shared/`
   and pages link to them.
2. ~~How-lists-behave owner~~ — same resolution: `shared/list.spec.md`.
3. Sign-out discards unsaved changes without the confirmation Refresh asks
   for — specced as truth in `topnavbar/profile.spec.md`; fix queued as a task. Fix it?
4. Two backend-inappropriate strings were fixed to spec them honestly:
   the structure error ("Google Sheet" → "files") and the transactions empty
   state ("Add data in Google Sheets." → how transactions are actually
   created). Review the new wording.
5. American spellings remain in pre-ADR-0016 ADRs and framework-generated
   files per adoption-on-next-edit.
6. ~~`FRAMEWORK.local.md` names `openspec/specs/` as canonical~~ —
   flipped to this tree with the `specs/features/` deletion;
   ~~the fate of `openspec/`~~ decided: removed entirely,
   with its tooling, on Carlos's ruling (2026-07-19).
7. The purchase page keeps its own "Save changes" —
   a declared departure from the shell's no-save rule,
   because the lots-must-match rule needs a gate.
   Bless the departure, or design the gate into the header Save?

## Spec-led deviations awaiting implementation

The consolidated, ordered backlog now lives in
[DIVERGENCES.md](DIVERGENCES.md) —
this list remains the quick reference it carries forward.

The spec is the contract; these are the known places the code lags it.

From the first drafting pass:

- **In-memory migration with Confirm and close**
  ([ADR-0009](ADRs/ADR-0009-migration-wizard-additive-schema-in-memory.md),
  `migration/wizard.spec.md`):
  implemented on `feat/spec-divergences-implementation`,
  pending merge.
- **Damaged-metadata overwrite guard**
  (`welcome/local-folder.spec.md`):
  a real shop with a corrupt metadata file gets the "create new shop" offer,
  and confirming overwrites it; wants a defensive check.
- **Sign-out discards unsaved edits without confirming**
  (`topnavbar/profile.spec.md`):
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
- **Repository-level deleted filtering** (ADR-0012) —
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
- **Entity options converge on "‹id› — ‹name›"** —
  the pieces' material picker shows "‹name› (‹id›) — ‹qty› left".
- **The materials summary keeps its headers when empty** —
  today the whole section is replaced by a sentence.
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
  (the pricing spec dissolution).
- **One shared fuzzy matcher behind every search**
  ([ADR-0013](ADRs/ADR-0013-fuzzy-matching-in-every-search.md)) —
  the global search and the tag box
  need verifying against it and aligning.

## When the migration completes

Fold this checklist away —
the other completion duties are done:
`FRAMEWORK.local.md` points here,
and the old spec set is removed.
