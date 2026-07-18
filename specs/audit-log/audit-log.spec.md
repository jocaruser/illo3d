# Audit log

The shop's memory:
every change ever made —
who made it, when, to what, and what kind of change it was.
Nothing edits it, nothing deletes from it;
it only grows.

One row per change, newest first:

| Column | Shows |
|---|---|
| ID | The entry's own id |
| Actor | Who: a Google account's email, "local" for a local shop, or "migration" for entries the [upgrade backfilled](../migration/v1-to-v2.spec.md) |
| Action | A coloured badge: create and restore green, update blue, archive and delete red, migration its own |
| Entity | *What* changed — by name, linked to its page when it has one (a piece links into its job; things without pages show their id, unlinked). Deleted things keep the name they had — the log's deliberate exception to the "Deleted entity" rule, because history should read as it happened. |
| When | How long ago, with the exact moment on hover |
| Parent | For [cascades](../ADRs/ADR-0014-archive-then-delete-lifecycle.md): what caused this change — archiving a client shows the client here on each archived job's entry |

Above the table: a search box,
and two filters — by action, by kind of thing —
each [a dropdown](../shared/dropdown.spec.md).

An entry the log itself cannot read fully
is shown flagged rather than hidden —
the log never pretends.
Before anything has happened: "No audit entries yet".
