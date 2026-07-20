# ADR-0009: Migration wizard — additive schema, in-memory execution

- Status: Accepted
- Date: 2026-07-17 (rewritten 2026-07-19,
  merged with the original storage-and-migration ADR
  into a single migration ADR)

## Context

The app is versioned, but its data stores are not databases —
they are local CSVs or Google Sheet documents (see ADR-0002)
that the user owns and can edit by hand.
When the app version's major number does not match
the shop recorded version's major,
the shop cannot open without running a migration.

Earlier iterations of this decision
(the original storage-and-migration ADR)
had migrations execute against a persisted working copy
(a sibling folder for local shops, a copied spreadsheet on Drive),
with the metadata version flip as the final atomic commit.
That was safe, but it wrote artefacts the user could see —
including abandoned half-migrated copies after a failure —
and it committed automatically the moment the last step finished.

The rest of the app follows a different, simpler contract (ADR-0003):
everything mutates in memory,
and nothing touches storage until the user explicitly saves.
The migration contract should match.

## Decision

### 1. Schema changes are additive only

New columns append at the END of a sheet's header row,
so stored headers are always a prefix of canonical headers
and data maps by position.
Renames and removals are prohibited;
a column that must die stays as a tombstone.

### 2. Migrations are declarative chained plans

Each plan declares (`fromMajor`, `toMajor`,
ordered idempotent steps),
and a registry chains them so a v1 shop runs v1→v2→v3
in one pass per major jump.

### 3. Migrations run in memory with explicit submit

The entire run executes **in memory, in the app context** —
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

### 4. The v1→v2 plan backfills the audit log

The v1→v2 plan backfills one `migration` audit entry
per pre-existing row (actor: `migration`),
giving the audit trail a defined starting point.

## Consequences

- Model evolution is routine instead of feared:
  adding a column is a plan step plus a major bump,
  and the wizard carries every existing shop forward.
- Column order is frozen forever per sheet;
  canonical headers grow monotonically.
- Header-prefix violation halts a migration with the source untouched —
  corrupt or hand-edited shops fail safe.
- Chained plans mean old shops never need bespoke handling;
  the cost is that intermediate plans must remain correct indefinitely.
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
