# ADR-0014: Nothing is destroyed — archive first, soft-delete second

- Status: Accepted
- Date: 2026-07-18

## Context

The shop's records are business history —
deleting a client or a job outright would also
falsify money totals and the audit trail.
Since v2 the product has had no hard delete for domain records
(tag links are the one pragmatic exception),
but the decision was only implied by specs and code,
never recorded.

## Decision

Every domain record follows the same two-stage lifecycle:

- **Archive** is the everyday "remove":
  the record leaves lists and search,
  stays reachable at its own address read-only,
  and still counts wherever history demands it
  (an archived piece still prices its job).
- **Soft delete** exists only for archived records:
  the record's own address stops resolving
  ([not-found](../not-found.spec.md)),
  and other places show "Deleted entity" instead of its name.
- Both **cascade down ownership**:
  archiving a client archives its jobs,
  each job its pieces and their material lines,
  and each entity its notes and tag links.
  Restoring does **not** cascade —
  each child is brought back deliberately, one by one.
- Rows are never removed from storage;
  both states are reversible in principle,
  and every transition is recorded in the audit log.

## Consequences

- Totals and the audit trail stay truthful
  through any amount of tidying up.
- "Delete" in the UI always means archive;
  real deletion requires two deliberate steps
  and still destroys nothing.
- Lists must filter, not the storage:
  every reader excludes archived/deleted rows itself.
- Un-archiving a parent leaves its children archived —
  an occasional surprise, accepted to keep restores deliberate.
