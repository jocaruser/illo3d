# A job's page

Everything about one job, top to bottom:

- [The widgets](widgets.spec.md) — identity, status, money, risk.
- Tags and notes —
  the same sections every client has;
  [tags](../../clients/details/tags.spec.md)
  and [notes](../../clients/details/notes.spec.md) own the mechanics.
- [The pieces](pieces-table.spec.md) — what is being made.
- [The materials summary](materials-summary.spec.md) —
  what the making consumes.

A back link returns to [the list](../list.spec.md);
breadcrumbs behave as [navigation](../../navigation.spec.md) says.

## Lifecycle on this page

The page is where a job's whole
[lifecycle](../../decisions/ADR-0014-archive-then-delete-lifecycle.md)
is exercised:

- An active job offers **Edit** and **Archive**.
- An archived job is read-only —
  no editing anywhere on the page —
  and offers **Un-archive** and **Soft delete**.
- A soft-deleted job's address shows
  [not found](../../not-found.spec.md),
  and other pages call it "Deleted entity".

## Children are history, not clutter

Embedded tables on a details page —
this page's pieces, a client's jobs —
show *all* children, whatever their state:
archived ones struck through, read-only, with an Un-archive action;
soft-deleted ones struck through as "Deleted entity".
The full story of a parent stays visible in one place,
even when its parts have been tidied away.
