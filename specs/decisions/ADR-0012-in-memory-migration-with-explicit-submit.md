# ADR-0012: Migrations run in memory and persist only on explicit submit

- Status: Accepted
- Date: 2026-07-17

## Context

ADR-0004 point 3 had migrations execute against a persisted working copy
(a sibling folder for local shops, a copied spreadsheet on Drive),
with the metadata version flip as the final atomic commit.
That is safe, but it writes artefacts the user can see —
including abandoned half-migrated copies after a failure —
and it commits automatically the moment the last step finishes.

The rest of the app follows a different, simpler contract (ADR-0002):
everything mutates in memory,
and nothing touches storage until the user explicitly saves.

## Decision

Migration adopts the same contract:

- The entire run executes **in memory, in the app context** —
  no working copy is written anywhere.
- The **backup is the one exception**, by design:
  if the user asked for one,
  it is written at its own step in the run,
  as a copy of the shop *as it currently is*.
- After every step has completed,
  a **Confirm and close** action appears.
  Pressing it persists the upgraded shop and its new version in one go —
  that press is the commitment.
- Anything short of that press changes nothing:
  a failed step, a page refresh, closing the tab, logging out —
  the in-memory run simply evaporates,
  the shop is untouched,
  and reopening it shows the wizard again.

This supersedes ADR-0004 point 3 (the working-copy mechanism).
ADR-0004's other points —
additive-only schema, declarative chained plans,
the v1→v2 audit backfill, and `schema.dbml` mirroring —
stand unchanged.

## Consequences

- Failure handling needs no cleanup story:
  there are no abandoned artefacts, only the untouched shop.
- A completed-but-unsubmitted migration is deliberately losable —
  the user, not the app, decides the moment of commitment,
  exactly as with saving ordinary edits.
- A kept backup can outlive an unsubmitted migration:
  answering yes and never submitting leaves the backup copy behind.
- The wizard needs a submit control the current implementation lacks;
  `specs/migration/wizard.spec.md` describes the intended behaviour
  and the implementation follows it.
