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

In flight:

- [ ] `navigation.spec.md` — **drafted, awaiting confirmation**
  (breadcrumb rule lives here; page specs must link to it, never restate it)
- [ ] `saving.spec.md` — **drafted, awaiting confirmation**
  (two-tabs truth backed by ADR-0013, also drafted)
- [ ] `not-found.spec.md` — **drafted, awaiting confirmation**
  (own loose file per round 7; details specs link here for soft-deleted pages)

Loose surfaces, not yet planned:

- [ ] `search.spec.md` — global search
- [ ] `profile.spec.md` — identity, sign out, version row
  (whether theme/language stay inside it: TBD)
- [ ] `entities/metadata.spec.md` — the shop metadata file
  (forward-referenced from `migration/wizard.spec.md`)

Pages, not yet planned:

- [ ] `dashboard/` — stats, kanban, calendar, stock alerts, recent transactions
- [ ] `clients/` — list; details (profile, metrics, timeline, notes, tags, jobs table)
- [ ] `jobs/` — list; details (widgets, pieces table, materials summary, notes, tags)
  — owns totals, benefit, due-date colours, consumption
- [ ] `inventory/` — list; details (item, lots, consumption)
- [ ] `transactions/` — list, purchase, expense details
- [ ] `audit-log/`

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
