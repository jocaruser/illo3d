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

### Requirement: Audit log page UI scaffolding exists

The system SHALL provide a minimal audit log page with route, navigation, breadcrumbs, and a placeholder table. No data fetching, filters, sorting, timeline rendering, or entity resolution shall be present.

#### Scenario: Route and navigation

- **WHEN** the application renders the main navigation
- **THEN** a link labeled "Audit Log" / "Registro de auditoría" navigates to `/audit-log`
- **AND** the route `/audit-log` renders a protected page

#### Scenario: Breadcrumb support

- **WHEN** viewing `/audit-log`
- **THEN** the breadcrumb shows "Home > Audit Log"

#### Scenario: Page shell and placeholder table

- **WHEN** viewing `/audit-log`
- **THEN** the page title is "Audit Log"
- **AND** a table displays the following column headers via i18n keys: `id`, `timestamp`, `actor`, `entity_name`, `entity_id`, `action`, `before_json`, `after_json`, `fieldsChanged`, `parent_entity_name`, `parent_entity_id`
- **AND** the table body shows the message "No audit entries yet" / "Aún no hay entradas de auditoría"
- **AND** the `COLUMNS` array is declared `as const` for type safety

#### Scenario: Internationalization

- **WHEN** inspecting `src/locales/en.json` and `src/locales/es.json`
- **THEN** the following keys are present:
  - `nav.auditLog`
  - `auditLog.title`
  - `auditLog.empty`
  - `auditLog.colId`, `auditLog.colTimestamp`, `auditLog.colActor`, `auditLog.colEntityName`, `auditLog.colEntityId`, `auditLog.colAction`, `auditLog.colBeforeJson`, `auditLog.colAfterJson`, `auditLog.colFieldsChanged`, `auditLog.colParentEntityName`, `auditLog.colParentEntityId`

### Requirement: Audit log page has E2E coverage

The system SHALL include end-to-end tests that verify the audit log page loads and displays the empty state.

#### Scenario: E2E navigation and empty state

- **WHEN** running `tests/e2e/audit-log.spec.ts`
- **THEN** at least one test verifies navigating to `/audit-log` from the header nav using a `data-testid` selector
- **AND** at least one test verifies direct navigation to `/audit-log` shows the page container via a `data-testid` selector
- **AND** both tests assert the table is visible with the empty state via a `data-testid` selector
