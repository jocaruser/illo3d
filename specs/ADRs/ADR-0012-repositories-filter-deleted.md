# ADR-0012: Repositories filter deleted rows out

- Status: Accepted
- Date: 2026-07-18

## Context

[ADR-0011](ADR-0011-archive-then-delete-lifecycle.md) promises that
a deleted record never reaches the app.
Such a promise fails retail if every reader must remember to filter:
one forgotten check, and a deleted job's money surfaces in one total
while missing from another, and nothing matches up.
The promise has to be kept wholesale, in one place.

## Decision

Soft-deleted rows are dropped at the earliest,
most central point of the data path:
the repositories that read storage.

- No repository ever returns a deleted row.
  There is no flag, no "include deleted" escape hatch.
- Everything above — services, pages, totals, search, links —
  is written as if deleted rows do not exist,
  because for that code none ever have.
- The audit log is not an exception but different data:
  its own rows are never deleted,
  and everything it shows it reads from what its rows stored
  at write time — it never resolves an entity to display it.
- The rows stay physically present in the Sheet or CSVs, flagged:
  the user's storage keeps its full history,
  and only the repository knows.

## Consequences

- One invariant, testable in one layer,
  instead of a filtering convention scattered over every reader.
- "As if the row was never there" is literal:
  outside the audit log's wording,
  no UI state for "deleted" exists at all.
- Bringing a deleted row back means hand-editing storage —
  deliberately outside the product.
