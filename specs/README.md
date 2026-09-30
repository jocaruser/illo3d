# Behaviour specs

This tree is the canonical, non-technical record of what illo3d does,
organised by what a user navigates.
The format is decided in
[ADR-0008](decisions/ADR-0008-page-focused-behaviour-specs.md)
(page-focused files, hybrid voice, user-observable scope,
owning-page rules, quoted meaningful copy, technical links allowed),
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

## Checklist

Statuses: unplanned → questions answered → **drafted (awaiting confirmation)** → confirmed & committed.

Done:

- [x] `welcome/` — welcome, local-folder, google-drive
- [x] `migration/` — wizard, v1-to-v2, v2-to-v3

Committed with the merge to main, content still open to amendment:

- [x] `navigation.spec.md`
  (breadcrumb rule lives here; page specs must link to it, never restate it)
- [x] `saving.spec.md`
  (two-tabs truth backed by ADR-0013)
- [x] `not-found.spec.md`
  (own loose file per round 7; details specs link here for soft-deleted pages)

Shared imports (cross-page behaviour):

- [ ] `shared/pricing.spec.md` — average cost, job completeness, margin,
  suggested price, expected benefit, client materials estimate
  (**drafted (awaiting confirmation)**)

Loose surfaces:

- [x] [`search.spec.md`](search.spec.md) — global search
- [x] `profile.spec.md` — identity, sign out, version row
  (whether theme/language stay inside it: TBD)
- [x] [`entities/metadata.spec.md`](entities/metadata.spec.md) — the shop metadata file
  (forward-referenced from `migration/wizard.spec.md`)

Pages, imported from the reconciled draft branches and re-checked against the current product:

- [x] [`dashboard/`](dashboard/dashboard.spec.md) — [stats](dashboard/stats.spec.md),
  [kanban](dashboard/kanban.spec.md), [calendar](dashboard/calendar.spec.md),
  [stock alerts](dashboard/stock-alerts.spec.md),
  [recent transactions](dashboard/recent-transactions.spec.md)
- [x] `clients/` — list; details ([details](clients/details/details.spec.md),
  [metrics](clients/details/metrics.spec.md), [timeline](clients/details/timeline.spec.md),
  jobs table)
- [x] `jobs/` — list; details ([details](jobs/details/details.spec.md),
  [widgets](jobs/details/widgets.spec.md),
  [materials summary](jobs/details/materials-summary.spec.md), pieces table)
  — owns totals, benefit, due-date colours, consumption
- [x] `inventory/` — [list](inventory/list.spec.md); details
  ([item](inventory/details/item.spec.md), [lots](inventory/details/lots.spec.md),
  [consumption](inventory/details/consumption.spec.md))
- [x] `transactions/` — [list](transactions/list.spec.md),
  [purchase](transactions/purchase.spec.md), expense details
- [x] [`audit-log/`](audit-log/audit-log.spec.md)
- [x] [`shared/lists.spec.md`](shared/lists.spec.md) — how every list behaves

Decision: [ADR-0015](decisions/ADR-0015-derived-pricing-and-income-on-paid.md)
(derived pricing and income on paid).

## Spec-led deviations awaiting implementation

The spec is the contract; these are the known places the code lags it:

- **In-memory migration with Confirm and close**
  ([ADR-0012](decisions/ADR-0012-in-memory-migration-with-explicit-submit.md),
  `migration/wizard.spec.md`):
  today's code persists a working copy and commits automatically;
  the spec requires an in-memory run, backup written only at its step,
  and an explicit submit. E2e assertions on working-copy artefacts
  must change with it.
- **Hop-aware wizard explanation**:
  the modal's description block always tells the v2 story;
  each hop should describe itself,
  with the shared promise reduced to "No data is removed or altered."
- **Newer-shop-than-app experience**:
  a shop stamped with a newer major shows the wizard with nowhere to go;
  needs a distinct "this shop needs a newer app" outcome, then a spec update.
- **Damaged-metadata overwrite guard**
  (`welcome/local-folder.spec.md`):
  a real shop with a corrupt metadata file gets the "create new shop" offer,
  and confirming overwrites it; wants a defensive check.
- **Local re-permission on reopen**
  (`welcome/local-folder.spec.md`):
  "the browser may first ask you to re-allow access" is unverified;
  check the lapsed-permission path, likely add a friendly re-allow prompt.

## When the migration completes

Point `FRAMEWORK.local.md`'s specification-location note at this tree,
decide the fate of `openspec/`,
and fold this checklist away.
