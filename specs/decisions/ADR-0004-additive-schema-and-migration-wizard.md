# ADR-0004: Additive-only schema evolution behind a migration wizard

- Status: Accepted
- Date: 2026-07-16

## Context

Shops carry a semver in `illo3d.metadata.json`; the app refuses to open a shop whose major
differs from `APP_VERSION`. Users' shops are their own files — the app cannot assume it may
rewrite them, and a botched migration of a spreadsheet is unrecoverable without a copy. v2
shipped a migration modal whose Continue button did nothing; the v3 rewrite needed real
schema changes (`jobs.due_date`, `inventory.colour`).

## Decision

1. **Schema changes are additive only**: new columns append at the END of a sheet's header
   row, so stored headers are always a prefix of canonical headers and data maps by position.
   Renames and removals are prohibited; a column that must die stays as a tombstone.
2. **Migrations are declarative plans** (`fromMajor`, `toMajor`, ordered idempotent steps)
   chained by a registry, so a v1 shop runs v1→v2→v3 in one pass.
3. **Runs execute against a working copy** (subdirectory for Local CSV, spreadsheet copy for
   Drive) with an optional user-chosen backup; the `illo3d.metadata.json` version flip is the
   LAST operation — the atomic commit. A failed run leaves the source shop untouched and
   still openable at its old version.
4. The v1→v2 plan backfills one `migration` audit entry per pre-existing row, giving the
   audit trail a defined starting point.
5. `schema.dbml` mirrors `src/Config/schema.ts` and is updated in the same PR as any schema
   change.

## Consequences

- Model evolution is routine instead of feared: adding a column is a plan step plus a major
  bump, and the wizard carries every existing shop forward.
- Column order is frozen forever per sheet; canonical headers grow monotonically.
- Header-prefix violation halts a migration with the source untouched — corrupt or
  hand-edited shops fail safe.
- Chained plans mean old shops never need bespoke handling; the cost is that intermediate
  plans must remain correct indefinitely.
