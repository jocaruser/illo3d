# Migration wizard

Opening a shop made by an older version of the app —
from a [local folder](../welcome/local-folder.spec.md)
or from [Google Drive](../welcome/google-drive.spec.md) —
does not open it.
Instead the **Migration Wizard** appears:
a dialog that upgrades the shop before it can be used.

## When it triggers

Every shop records the app version that created or last upgraded it,
in [the shop's metadata file](../entities/metadata.spec.md).
Opening a shop compares that recorded version
against the app's own
([`src/Config/version.ts`](../../src/Config/version.ts)).

Versions have three numbers,
and **only the first — the major — matters here**:
majors change only when the shop's data layout changes
([`schema.dbml`](../../schema.dbml), [ADR-0011](../decisions/ADR-0011-semver-and-per-pr-bump.md)).
A shop from an older minor or patch release simply opens;
a shop whose major is behind gets this wizard.

The wizard only ever upgrades.
A shop whose major is **ahead** of the app's is told so instead,
back on the welcome screen:
**"This shop was made by a newer version of this app.
Update the app to open it."**
A shop whose recorded version cannot be read at all gets
**"This shop's version could not be read."**
In neither case does the wizard open.

However old the shop, one continuous run brings it to the current version:
a very old shop simply has more steps in the same run.
What each upgrade changes for the user is described per hop:
[v1 → v2](v1-to-v2.spec.md) and [v2 → v3](v2-to-v3.spec.md).

## What the dialog shows

- The shop's **"Current version"** and the app's **"Target version"**.
- The same language and theme switches as the
  [welcome screen](../welcome/welcome.spec.md) —
  a migrating user has not reached the app's own controls yet.
- An explanation of what this particular upgrade unlocks
  (each hop describes its own — see the hop files),
  always ending with the same promise:
  **"No data is removed or altered."**
- The backup question (below).
- A grid of cards, one per upgrade step plus one for the backup,
  each labelled with what it works on
  (Clients, Jobs, Audit Log, …).
- Two actions: **Continue** and **Log out**.

## The backup question

**"Would you like to back up your shop before migrating?"**
with two answers that toggle —
"Yes, back up my shop" / "No, skip backup".
Picking one highlights it;
picking it again un-answers the question.

Scenarios:

- Answering **No**
  → a warning appears:
  "We strongly recommend creating a manual backup before proceeding.
  This ensures you have a restore point if anything goes wrong."
  The backup card in the grid resolves to done, labelled "Skipped".
- **Continue is paced, deliberately.**
  It stays disabled until the question is answered;
  once answered, a ring animates around it for five seconds
  before it arms (shown with a tick).
  Changing the answer restarts the five seconds.
  There is no way to continue on autopilot.

## How the upgrade runs — and why failure is safe

The upgrade never edits the shop directly.
The whole run happens **in memory, inside the app** —
nothing is written anywhere while the steps work.
The one exception is deliberate:
if backup was answered **Yes**,
the backup step writes a copy of the shop *as it currently is*,
kept beside it.

While it runs:
each card moves pending → running → done,
a summary counts "‹done› of ‹total› done" (then "All done"),
and the backup answer and Log out are locked.

When every step has completed,
a **Confirm and close** action appears.
Pressing it is the moment of commitment:
the upgraded shop and its new version are saved in one go,
and the shop opens.
Until it is pressed, the shop has not changed at all.

Scenarios:

- All steps done, **Confirm and close** pressed
  → the shop opens, now on the current version.
- All steps done, but the page is refreshed or closed
  before pressing Confirm and close
  → the migration is lost —
  it only ever existed in memory —
  and reopening the shop shows this wizard again, from the start.
- Any step fails
  → the run halts on a red card,
  **"Migration failed"** appears with the reason.
  Nothing was written; the shop is untouched;
  reopening it shows this wizard again.
- Answered **Yes** to backup
  → the backup copy exists from its step onwards —
  even if the migration is never submitted.
- Answered **No**
  → nothing extra is kept.
- **Log out** at any point
  → back to the [welcome screen](../welcome/welcome.spec.md),
  shop untouched.
