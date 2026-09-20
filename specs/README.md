# Behaviour specs

This tree is the canonical, non-technical record of what illo3d does,
organised by what a user navigates.
The format is decided in
[ADR-0008](decisions/ADR-0008-page-focused-behaviour-specs.md)
(page-focused files, hybrid voice, user-observable scope,
page-agnostic mechanics in `shared/`, quoted meaningful copy,
technical links allowed),
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

Reviewed and confirmed in session:

- [x] `welcome/` — welcome, local-folder, google-drive
- [x] `migration/` — wizard, v1-to-v2, v2-to-v3
- [x] `navigation.spec.md`, `saving.spec.md`, `not-found.spec.md`
  (committed with the merge; content amendable)

Imported from the unshipped `feat/spec-divergences-implementation` corpus on card **kpAlk5K1Yu6M** — **drafted, awaiting confirmation**:

- [x] `search.spec.md`, `profile.spec.md`, `entities/metadata.spec.md`
- [x] `dashboard/` — overview, stats, kanban, calendar, stock-alerts, recent-transactions
- [x] `shared/` — notes, tags, lists, lifecycle (page-agnostic mechanics)
- [x] `jobs/` — list; details: overview, widgets, pieces-table, materials-summary
- [x] `clients/` — list; details: overview, metrics, timeline, jobs-table
  (notes and tags link to `shared/`)
- [x] `inventory/` — list; details: item, lots, consumption
- [x] `transactions/` — list, purchase, expense-details
- [x] `audit-log/audit-log.spec.md`
- [x] ADR-0014 (archive-then-delete lifecycle), ADR-0015 (derived pricing,
  income on paid) — promoted per reconciliation backlog

## Spec-led deviations awaiting implementation

The actionable backlog for code delivery lives in
[`specs/changes/kpAlk5K1Yu6M/reconciliation-backlog.md`](changes/kpAlk5K1Yu6M/reconciliation-backlog.md),
with comparison evidence in
[`comparison-report.md`](changes/kpAlk5K1Yu6M/comparison-report.md).

Highlights the integration branch still owes:

- **In-memory migration with Confirm and close**
  ([ADR-0012](decisions/ADR-0012-in-memory-migration-with-explicit-submit.md),
  `migration/wizard.spec.md`) — follow-on card **QUEUE-L01**.
- **Detail-page lifecycle state machine**
  (`shared/lifecycle.spec.md`, detail pages) — **QUEUE-L02** / **PR136-S06**.
- **Hop-aware wizard explanation** — **QUEUE-M04**.
- **Newer-shop-than-app and unreadable version** — **QUEUE-M05**
  (spec prose for newer/unreadable outcomes is already on this branch).
- **Damaged-metadata overwrite guard** — **QUEUE-M06**.
- **Local re-permission on reopen** — **QUEUE-M07**.
- **Sign-out confirms when dirty and clears folder handle** — **QUEUE-M08**.
- **Breadcrumbs resolve names** — spec updated; implementation **QUEUE-M09**.
- **Calendar Today control** — **QUEUE-M10**.
- **Notes order and dead mentions** — **QUEUE-M11**.
- **Client jobs table Total column** — **QUEUE-M12**.
- **Materials summary labelling** — **QUEUE-M13**.
- **Expense save atomicity** — **QUEUE-M14**.

Structural refactors named only in PR #136's second-edition audit are tracked as **PR136-S01** through **PR136-S09** in the same backlog.

## When the migration completes

Point `FRAMEWORK.local.md`'s specification-location note at this tree,
decide the fate of `openspec/`,
and fold this checklist away.
