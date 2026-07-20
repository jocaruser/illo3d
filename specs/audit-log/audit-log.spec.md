# Audit log

A page at `#/audit-log`, with a table —
the shop's memory:
every change ever made,
who made it, when, to what, and what kind of change it was.
Nothing edits it, nothing deletes from it;
it only grows.
It follows [the list page](../shared/list.spec.md);
its title is "Audit Log",
with no Add button and no Actions column —
and instead, beside
[the search box](../shared/search-box.spec.md),
two filters — by action, by kind of thing —
each [a dropdown](../shared/dropdown.spec.md).

One row per change, newest first:

| Column | Viewport | Shows |
|---|---|---|
| ID | Always | The entry's own id |
| Actor | Always | Who: a Google account's email, "local" for a local shop, or "migration" for entries the [upgrade backfilled](../migration/v1-to-v2.spec.md) |
| Action | Always | A coloured badge: create and restore green, update blue, archive and delete red, migration its own |
| Entity | Always | *What* changed — the name the entry recorded when written, [linked](../shared/linking.spec.md) while the thing exists. A delete entry names only the kind — "a Job was removed" — never the name ([ADR-0014](../ADRs/ADR-0014-archive-then-delete-lifecycle.md)). |
| When | Always | How long ago, with the exact moment on hover |
| Parent | Always | For [cascades](../ADRs/ADR-0014-archive-then-delete-lifecycle.md): what caused this change |

An entry the log itself cannot read fully
is shown flagged rather than hidden —
the log never pretends.
The quiet empty row: "No audit entries yet".
