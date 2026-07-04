# Schema Documentation

## Purpose

Defines standards for maintaining a DBML-based schema document that mirrors the application's data model (Google Sheets tabs / CSV files).

## Requirements

### Requirement: DBML schema file exists at repository root
The repository SHALL contain a `schema.dbml` file at the root directory that documents all data tables used by the application.

#### Scenario: File is present and parseable
- **WHEN** a developer opens `schema.dbml` in a DBML-compatible viewer (e.g., dbdiagram.io)
- **THEN** the viewer renders an entity-relationship diagram with all 10 tables and their relationships

### Requirement: DBML file mirrors SHEET_HEADERS columns
Every table defined in `SHEET_HEADERS` (`src/services/sheets/config.ts`) SHALL have a corresponding `Table` block in `schema.dbml` with all columns listed in the same order, including lifecycle columns (`archived`, `deleted`).

#### Scenario: Column count matches
- **WHEN** a table in `config.ts` has N columns (including lifecycle columns)
- **THEN** the corresponding `Table` block in `schema.dbml` SHALL list exactly N columns

#### Scenario: New column added to config
- **WHEN** a developer adds a column to any table in `SHEET_HEADERS`
- **THEN** the `schema.dbml` file SHALL be updated to include the new column in the same PR

### Requirement: Foreign key relationships are declared
All direct (non-polymorphic) relationships between tables SHALL be declared as `ref:` annotations on the referencing column and repeated in a summary `Ref:` block at the end of the file.

#### Scenario: Direct FK is documented
- **WHEN** table A has a column that references table B's `id` (e.g., `jobs.client_id` → `clients.id`)
- **THEN** `schema.dbml` SHALL include `ref: > B.id` on that column and a `Ref: A.col > B.id` line in the summary block

### Requirement: Polymorphic relationships use column notes
Columns that reference different tables depending on a discriminator column (e.g., `entity_type`) SHALL NOT use `ref:` syntax. Instead, they SHALL include a `note:` describing the valid target tables.

#### Scenario: Polymorphic FK is documented via note
- **WHEN** `crm_notes.entity_id` can reference either `clients` or `jobs` based on `entity_type`
- **THEN** the column SHALL have `note: 'client | job'` and no `ref:` annotation

### Requirement: Column types use varchar or numeric
All columns SHALL be typed as either `varchar` (for strings, dates, enums, booleans stored as text) or `numeric` (for quantities, prices, and counts). SQL-specific types SHALL NOT be used.

#### Scenario: String column is varchar
- **WHEN** a column stores text, dates, or enum values
- **THEN** its type in DBML SHALL be `varchar`

#### Scenario: Number column is numeric
- **WHEN** a column stores a quantity, price, or count
- **THEN** its type in DBML SHALL be `numeric`

### Requirement: Enum-like columns document valid values in notes
Columns that accept a fixed set of string values (e.g., `status`, `type`, `severity`) SHALL include a `note:` listing all valid values separated by ` | `.

#### Scenario: Status column lists values
- **WHEN** `jobs.status` accepts `draft`, `in_progress`, `delivered`, `paid`, `cancelled`
- **THEN** the column SHALL have `note: 'draft | in_progress | delivered | paid | cancelled'`
