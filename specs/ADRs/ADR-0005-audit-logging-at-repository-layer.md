# ADR-0005: Audit logging at the repository layer

- Status: Accepted
- Date: 2026-07-16

## Context

The app targets a
GitHub Pages compatible
static-file deployment
   (see ADR-0001),
so there is no
traditional database
   (see ADR-0002)
with built-in audit capabilities.
An application-level
audit trail is required.

## Decision

Audit writes are emitted from a single chokepoint —
the data access layer that every mutation passes through —
not from individual domain services.

The action recorded
(create, update, archive, delete, restore)
is inferred automatically from the entity's
state transition between its before and after snapshot,
never passed explicitly by the caller.

Each audit entry records:
- a full snapshot of the entity before and after the change
- which actor performed it
- when it occurred
- a computed list of which fields changed
- the immediate parent entity when the change was triggered
  by a cascading operation (e.g., archiving a client cascades
  to its jobs; each job entry records the client as parent)

Audit entries are immutable:
once written they are never modified.
The audit log itself carries no lifecycle columns
and is never archived or deleted.

Domain entities remain first-class sheets —
there is no event sourcing or command log.

## Consequences

- New entity types get audit coverage automatically
  by inheriting from the base data access layer;
  no per-entity audit code is needed.
- Domain services never touch the audit log,
  keeping them free of cross-cutting concerns.
- The log is denormalised and grows monotonically;
  reading it requires a full scan (O(n) per hydrate),
  acceptable at the expected scale.
  A retention or compaction strategy may be added
  if the log grows hot.
- A migration backfill with a designated system actor
  gives migration added audit rows a defined baseline entry
     (see ADR-0009).
