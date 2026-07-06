## ADDED Requirements

### Requirement: Audit log schema exists

The system SHALL define an `AuditEntry` type available for future use.

#### Scenario: Type definition

- **WHEN** inspecting `src/types/money.ts`
- **THEN** the following types are defined:
  - `AuditEntityName` — union of all auditable entity table names
  - `AuditAction` — union of `create | update | archive | delete | restore`
  - `AuditEntry` — interface with fields: `id`, `timestamp`, `actor`, `entity_name`, `entity_id`, `action`, `before_json`, `after_json`, `fieldsChanged`, `parent_entity_name?`, `parent_entity_id?`

### Requirement: Audit log is registered as a sheet

The data layer configuration SHALL include `audit_log` as a recognized sheet name with headers matching the `AuditEntry` field order.

#### Scenario: Configuration presence

- **WHEN** inspecting `src/services/sheets/config.ts`
- **THEN** `audit_log` is present in both `SHEET_NAMES` and `SHEET_HEADERS`

### Requirement: Audit log fixtures exist

Every fixture data set SHALL include an empty `audit_log.csv` so the tab layout is consistent across all environments.

#### Scenario: Empty fixture files

- **WHEN** listing CSV files in any fixture directory (`empty`, `happy-path`, `imports`, `kanban-stale-jobs`, `missingcolumn`)
- **THEN** an `audit_log.csv` file exists containing exactly one header row
