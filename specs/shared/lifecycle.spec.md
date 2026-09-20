# Lifecycle on a details page

Every entity with a page of its own —
a job, a client, a material —
exercises its
[lifecycle](../decisions/ADR-0014-archive-then-delete-lifecycle.md)
there, the same way:

- An active entity offers **Edit** and **Archive**.
- An archived entity is read-only —
  no editing anywhere on the page —
  and offers **Un-archive** and **Soft delete**.
- A soft-deleted entity's address shows
  [not found](../not-found.spec.md),
  and other pages call it "Deleted entity".

(Today's code lags parts of this machine —
editable archived pages, missing Un-archive controls —
[queued](../DIVERGENCES.md) as one piece of work.)

## Children are history, not clutter

Embedded tables on a details page —
a job's pieces, a client's jobs —
show *all* children, whatever their state:
archived ones struck through, read-only, with an Un-archive action;
soft-deleted ones struck through as "Deleted entity".
The full story of a parent stays visible in one place,
even when its parts have been tidied away.
