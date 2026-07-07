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

Every fixture data set SHALL include an `audit_log.csv` with content appropriate to its purpose.

#### Scenario: Empty fixture files

- **WHEN** listing CSV files in the `empty` fixture directory
- **THEN** an `audit_log.csv` file exists containing exactly one header row

#### Scenario: Happy-path fixture has basic smoke data

- **WHEN** reading `fixtures/happy-path/audit_log.csv`
- **THEN** it contains exactly one header row plus at least 18 data rows
- **AND** each row references an entity that exists in a corresponding CSV file within the same fixture directory
- **AND** entity names use physical table names (`crm_note` for notes, `transaction` for purchases)
- **AND** every entity in the fixture has at least one corresponding audit entry

#### Scenario: Audit-rich fixture has comprehensive coverage

- **WHEN** reading `fixtures/audit-rich/audit_log.csv`
- **THEN** every entity in the fixture has at least one corresponding audit entry
- **AND** every auditable entity type has at least one entity whose latest audit entry is `create`
- **AND** every auditable entity type has at least one entity whose latest audit entry is `update`
- **AND** every auditable entity type has at least one entity whose latest audit entry is `archive`
- **AND** every auditable entity type has at least one entity whose latest audit entry is `delete`
- **AND** every auditable entity type has at least one entity whose latest audit entry is `restore`
- **AND** every entity referenced in `entity_id` exists in the corresponding CSV file within the same fixture directory
- **AND** `parent_entity_name` and `parent_entity_id` are populated for cascade entries
- **AND** `fieldsChanged` lists all populated columns for `create` actions
- **AND** `fieldsChanged` lists only changed columns for `update` actions
- **AND** the timeline spans at least two distinct months
- **AND** for every entity whose latest action is not `create`, an earlier `create` entry exists for the same `entity_id`

### Requirement: Audit log fixture data is internally consistent

Fixture CSV files within the same directory SHALL reference only entities that exist in sibling files.

#### Scenario: No phantom references in happy-path

- **WHEN** reading `fixtures/happy-path/audit_log.csv`
- **THEN** no `entity_id` references an entity that does not exist in the corresponding fixture CSV
- **AND** entity names match physical table names from the DBML schema

#### Scenario: Cascade tracking alignment

- **WHEN** reading `fixtures/audit-rich/jobs.csv`, `pieces.csv`, and `piece_items.csv`
- **AND** reading `fixtures/audit-rich/audit_log.csv`
- **THEN** entities with `archived` timestamps have corresponding `archive` audit entries
- **AND** entities with `deleted` timestamps have corresponding `delete` audit entries
- **AND** parent entities are archived/deleted before their children in chronological order

### Requirement: Audit log E2E tests use appropriate fixtures

The E2E test suite SHALL use fixture scenarios that match the test intent.

#### Scenario: Empty-state test isolation

- **WHEN** reading `tests/e2e/audit-log.spec.ts`
- **THEN** the empty-state tests use the `empty` fixture scenario
- **AND** populated-state tests use the `audit-rich` fixture scenario

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
