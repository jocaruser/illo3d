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

Every surface and page is drafted.
Carlos's review of the self-directed batch (everything below the line) is pending.

Reviewed and confirmed in session:

- [x] `welcome/` — welcome, local-folder, google-drive
- [x] `migration/` — wizard, v1-to-v2, v2-to-v3
- [x] `navigation.spec.md`, `saving.spec.md`, `not-found.spec.md`
  (committed with the merge; content amendable)

---

Self-directed, awaiting Carlos's review:

- [x] `search.spec.md`, `profile.spec.md`, `entities/metadata.spec.md`
- [x] `dashboard/` — overview, stats, kanban, calendar, stock-alerts, recent-transactions
- [x] `shared/` — notes, tags, lists, lifecycle (page-agnostic mechanics)
- [x] `jobs/` — list; details: overview, widgets
  (owns totals, due colours, paid dialogs), pieces-table (owns consumption),
  materials-summary
- [x] `clients/` — list; details: overview, metrics, notes (owns mentions
  and severities), tags (owns the shared pool), timeline, jobs-table
- [x] `inventory/` — list; details: item, lots, consumption
- [x] `transactions/` — list, purchase, expense-details
- [x] `audit-log/audit-log.spec.md`
- [x] ADR-0014 (archive-then-delete lifecycle), ADR-0015 (derived pricing,
  income on paid) — extracted hidden decisions

## Questions for review

1. ~~Notes and tags ownership~~ — resolved by Carlos's shared-folder
   decision: page-agnostic mechanics now live in `specs/shared/`
   (notes, tags, lists, lifecycle) and pages link to them.
2. ~~How-lists-behave owner~~ — same resolution: `shared/lists.spec.md`.
3. Sign-out discards unsaved changes without the confirmation Refresh asks
   for — specced as truth in `profile.spec.md`; fix queued as a task. Fix it?
4. Two backend-inappropriate strings were fixed to spec them honestly:
   the structure error ("Google Sheet" → "files") and the transactions empty
   state ("Add data in Google Sheets." → how transactions are actually
   created). Review the new wording.
5. American spellings remain in pre-ADR-0010 ADRs and framework-generated
   files (`specs/features/README.md`, `specs/ui/`) per adoption-on-next-edit.
6. `FRAMEWORK.local.md` still names `openspec/specs/` as canonical;
   flip it to this tree after review? The fate of `openspec/` stays open.

## Spec-led deviations awaiting implementation

The full audited backlog lives in [DIVERGENCES.md](DIVERGENCES.md) —
a four-way spec-versus-code audit consolidated into one implementation
queue (35 items, large to small), the spec amendments it forced,
and the rulings taken.
That file is the single source of truth for what the code owes the specs;
this README no longer keeps its own copy.

## When the migration completes

Point `FRAMEWORK.local.md`'s specification-location note at this tree,
decide the fate of `openspec/`,
and fold this checklist away.
