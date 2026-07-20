# ADR-0002: Data storage — in the user's filesystem or Google Drive

- Status: Accepted (rewritten 2026-07-19,
  broadened from schema-only to database decision;
  schema definition moved to a subsection)
- Date: 2026-07-19

## Context

The app deploys as a static bundle on GitHub Pages
with no server at runtime (ADR-0001).
It cannot have a traditional database
with a daemon, socket, or connection string.
All data must live in storage the user owns
and can inspect directly.

The user has two natural options:
a local folder on their machine,
or Google Drive (where the sheets already live
for the Google Sheets API backend).
The app needs to support both without
duplicating business logic.

At the same time,
the app's data model must be defined in one place
so that both backends (and all tooling)
agree on table names, column order, and types.

## Decision

### Two backends, one contract

Data storage has exactly two implementations:
a local-filesystem backend
(reading and writing CSV files via the File System Access API)
and a Google Drive backend
(reading and writing Google Sheets via the Sheets v4 and Drive v3 APIs).

Both implement the same narrow interface —
read a table snapshot, apply a mutation —
so the rest of the app (repositories, services, UI)
is backend-agnostic.
Switching between them is a wiring change
at the composition root.

A third backend (e.g. Dropbox, SQLite via WASM)
would mean implementing the same interface again.
No domain or repository code would change.

### Canonical schema definition

Because the two backends share a contract,
the shape of the data must be defined
in exactly one authoritative place.

#### A single, tool-agnostic file is the source of truth

A plain-data file
(not runtime code, not a binary format)
defines every table name,
the canonical column order,
which tables carry domain data,
and which are immutable (append-only, no lifecycle columns).

It is kept in a format
readable by any tool, language, or agent
without a parser or build step.

#### Runtime code re-exports the source of truth

The app's runtime config imports this file
and re-exports typed constants.
It adds type-level constructs
(e.g. union types that the plain-data format cannot express),
but the values originate from the canonical file.
The app never reads the canonical file at runtime —
it uses the re-exported constants.

#### The visual diagram is derived

A diagram file at the repository root
mirrors the canonical file.
It exists for human and agent readers
who want a visual overview of tables, columns, and relationships.
It is not read by the app
and is not an independent authority.

#### A companion spec captures context outside the format

A prose spec file alongside the canonical file
documents what the format cannot express:
storage backends, column type conventions,
the lifecycle-column protocol,
versioning and migration rules,
and the audit-log immutability exception.
See `specs/technical/database-model/spec.md`.

#### All representations update together

Any PR that changes the data model
updates the canonical file first,
then the runtime config (if types need updating)
and the diagram file,
so the three never diverge on the main branch.

#### Columns map by position, not by name

Storage rows store values
in a fixed order matching the canonical header.
A stored header row must be a prefix of the canonical header
(guaranteed by the additive-only migration rule, ADR-0009).
The app reads by index, never by column name,
so column order is frozen once a version ships.

#### Every data table carries lifecycle columns

Every table except the immutable audit log
has a designated pair of lifecycle columns
as its last two columns.
The canonical file defines the pair,
and every data-access layer relies on it.
Related decisions define the behaviour
these columns enable (ADR-0011, ADR-0012).

#### The canonical file describes storage, not domain

The canonical file describes
how data is laid out in storage,
not the domain invariants that entities enforce.
An entity class may validate
that only certain status values are written,
but the schema column is still just a string.
Domain rules belong in entities and services,
not in the schema definition.

## Consequences

- The app ships with two working backends;
  the user chooses based on whether they prefer
  local files or Google Drive.
- Everything above the storage interface
  (repositories, services, controllers)
  is backend-agnostic and tested once.
- Adding a third backend means implementing
  the narrow storage interface —
  no domain or schema changes needed.
- The canonical schema file is the single authority
  for table layout across both backends and all tooling.
- The runtime config is a thin typed re-export,
  not an independent source of truth.
- Changing a column or table means
  editing the canonical file first,
  then syncing the runtime config and diagram.
- The diagram file mirrors the canonical file
  and is never the cause of a schema bug.
- PR reviewers check the canonical file for schema correctness;
  the runtime config and diagram are checked
  for mirror fidelity only.
