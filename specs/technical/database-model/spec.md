# Database model — illo3d v3

This directory defines the canonical database model
in two files:

- **[`schema.dbml`](schema.dbml)** —
  the structural definition in DBML:
  tables, columns, types, primary keys, foreign keys,
  and inline annotations.
- **This file** —
  context that the DBML format cannot express:
  storage backends, type conventions,
  versioning, and how the model maps to the filesystem.

`schema.dbml` is the source of truth
for the database schema.
`src/Config/schema.ts` mirrors it as a typed runtime export;
`schema.dbml` at the repository root is a copy
kept in sync for discoverability.

## Storage backends

The same model is stored in two backends (see ADR-0004);
every column is available in both.

### Google Sheets

- One spreadsheet named `illo3d-data`
  with one sheet per table.
  Sheet names match the table names exactly.
- Columns map by position, not by name:
  the canonical header row order in `src/Config/schema.ts`
  defines the storage layout.
- No type enforcement.
  All cells are stored as strings.
- The `audit_log` sheet has no lifecycle columns.

### Local CSV folder

- One CSV file per table in a user-picked folder,
  named `<table>.csv`.
- The same positional header convention as Google Sheets.
- A separate `illo3d.metadata.json` file
  holds per-shop metadata
  (version, ids, preferences).
  Its schema is not in the DBML because it is not a sheet:
  it is a JSON document read and written
  through a different interface (`FolderRepositoryInterface`).

### Column type convention

All columns are `varchar` or `numeric`.
There are no dates, booleans, or structured types in storage.

- `varchar` — any text.
  ISO 8601 strings for instants, UUIDs for identities,
  lowercase codes for statuses.
- `numeric` — integer or decimal values
  (stored as strings in Sheets, as numbers in CSV).

The domain layer (`src/Entity/`) enforces parsing and validation
when reading these strings.

## Lifecycle columns

Every sheet except `audit_log`
has exactly two lifecycle columns at the end of its header:
`archived` and `deleted`.

- A null or empty value means the row is active.
- A non-null value marks the row as archived or deleted.
  The value itself is not interpreted —
  presence is the flag.
- `archived` rows are visible everywhere,
  struck through, read-only.
  See ADR-0014.
- `deleted` rows are filtered by all repositories
  and never reach the application.
  See ADR-0016.

## Versioning and migration

- Every shop carries its schema version
  in `illo3d.metadata.json` (`version` field, semver).
- The app's version is `APP_VERSION` in `src/Config/version.ts`.
- Schema changes are additive only:
  new columns append at the end of the header row.
  See ADR-0012.
- The major version comparison gates shop opening:
  a mismatch triggers the migration wizard.
  See ADR-0011.

## `audit_log` immutability

The `audit_log` table is the exception to every rule:

- No lifecycle columns — rows are never archived or deleted.
- No cascade — audit rows are never touched
  when the entity they record is deleted.
- Written once at the repository layer
  (see ADR-0005) and never modified.
