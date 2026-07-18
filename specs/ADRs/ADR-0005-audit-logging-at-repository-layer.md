# ADR-0005: Audit logging at the repository layer

- Status: Accepted
- Date: 2026-07-16

## Context

The v2 audit feature shipped read-only: an `audit_log` sheet and a display page, but no code
ever wrote entries. The abandoned `feat/audit-log-system-v2` branch wrote entries manually
from each service function — coverage was uneven (some entity types never audited) — and
folded notes/tag-links into event sourcing, diverging from the shipped schema.

## Decision

Audit writes happen in exactly one place: `AbstractSheetRepository.save()`/`remove()`, which
every mutation goes through. The repository infers the action from the lifecycle transition
(create / update / archive / delete / restore), and `AuditLogger` records full before/after
JSON snapshots plus a computed `fieldsChanged` list, the actor (Google email or `local`), and
— during cascades — the immediate parent entity that triggered the change. `audit_log` rows
are immutable and carry no lifecycle columns. Notes and tag links stay first-class sheets
(no event sourcing).

## Consequences

- Uniform coverage by construction: a new entity type gets auditing for free by extending the
  base repository; nobody can forget to emit.
- Domain services stay clean — they never touch the log.
- The log is denormalized and grows monotonically; reading it is O(n) per hydrate, acceptable
  at shop scale. A retention/compaction strategy is future work if logs grow hot.
- Migration backfill (`actor: migration`) gives pre-audit rows a defined baseline entry
  (see ADR-0004).
