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

### Requirement: Audit table displays resolved entity names with links

The audit log page SHALL replace the raw `entity_name` and `entity_id` columns with a single "Entity" column that displays the human-readable name of the audited entity and provides a clickable link to its most relevant detail page.

#### Scenario: Resolved entity with link

- **WHEN** the audit table renders an entry for entity type `client` with ID `CL1`
- **AND** client `CL1` exists in the current workbook with name "TechStart Solutions"
- **THEN** the Entity cell displays "TechStart Solutions"
- **AND** the text is a link to `/clients/CL1`

#### Scenario: Resolved entity via JSON fallback

- **WHEN** the audit table renders an entry for entity type `client` with ID `CL4`
- **AND** client `CL4` is deleted from the current workbook
- **AND** the entry's `after_json` contains `{"name":"Artisan Collective"}`
- **THEN** the Entity cell displays "Artisan Collective"
- **AND** the text is a link to `/clients/CL4`

#### Scenario: Unresolvable entity

- **WHEN** the audit table renders an entry for entity type `tag_link` with ID `TL3`
- **AND** `tag_link` has no name field and no detail page
- **THEN** the Entity cell displays the raw ID `TL3` with no link

## Requirements

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
- **AND** a table displays the following column headers via i18n keys: `id`, `timestamp`, `actor`, `entity`, `action`, `parent_entity`
- **AND** the table body shows the message "No audit entries yet" / "Aún no hay entradas de auditoría"
- **AND** the `COLUMNS` array is declared `as const` for type safety

#### Scenario: Internationalization

- **WHEN** inspecting `src/locales/en.json` and `src/locales/es.json`
- **THEN** the following keys are present:
  - `nav.auditLog`
  - `auditLog.title`
  - `auditLog.empty`
  - `auditLog.colId`, `auditLog.colTimestamp`, `auditLog.colActor`, `auditLog.colEntity`, `auditLog.colAction`, `auditLog.colParentEntity`
- **AND** the obsolete keys `colEntityName`, `colEntityId`, `colBeforeJson`, `colAfterJson`, `colFieldsChanged`, `colParentEntityName`, `colParentEntityId` are absent from both locale files

### Requirement: Audit log page has E2E coverage

The system SHALL include end-to-end tests that verify the audit log page loads and displays the empty state.

#### Scenario: E2E navigation and empty state

- **WHEN** running `tests/e2e/audit-log.spec.ts`
- **THEN** at least one test verifies navigating to `/audit-log` from the header nav using a `data-testid` selector
- **AND** at least one test verifies direct navigation to `/audit-log` shows the page container via a `data-testid` selector
- **AND** both tests assert the table is visible with the empty state via a `data-testid` selector

#### Scenario: Action pills and entity links

- **WHEN** running `tests/e2e/audit-log.spec.ts` with `fixtureScenario: 'audit-rich'`
- **THEN** at least one test verifies action pills have correct colors (green for create/restore, red for delete/archive, blue for update)
- **AND** at least one test verifies entity names are rendered as clickable links with correct `href` attributes
- **AND** at least one test verifies the new parent entity test row renders the parent name as a clickable link

### Requirement: Audit entries are parsed from sheet matrix

The system SHALL provide a parser that converts the `audit_log` sheet matrix into typed `AuditEntry` objects.

#### Scenario: Parser includes all rows and sorts

- **WHEN** inspecting `src/lib/workbook/workbookEntities.ts`
- **THEN** a `matrixToAuditEntries()` function exists
- **AND** it includes every data row from the matrix (does not silently discard malformed rows)
- **AND** it returns entries sorted by `timestamp` descending, then by `id` ascending as tiebreaker

### Requirement: Audit entries are exposed via workbook store hook

The system SHALL provide a Zustand selector hook that exposes parsed audit entries from the in-memory workbook.

#### Scenario: Hook exists and selects audit_log tab

- **WHEN** inspecting `src/stores/workbookStore.ts`
- **THEN** a `useSnapshotAuditEntries()` hook exists
- **AND** it uses `useMemo` with `matrixToAuditEntries`
- **AND** it subscribes only to `s.tabs.audit_log`

### Requirement: Audit log page renders loaded entries

The audit log page SHALL display audit entry data in its table when the `audit_log` sheet contains rows.

#### Scenario: Table body shows resolved data

- **WHEN** viewing `/audit-log` with a workbook that contains audit entries
- **THEN** the table body renders one row per `AuditEntry`
- **AND** each row displays: `id`, `timestamp`, `actor`, resolved entity name (or raw ID), action pill, resolved parent entity name (or raw ID/empty)
- **AND** rows are ordered newest-first by timestamp, then by `id` ascending
- **AND** rows with missing `id` or `timestamp` are rendered with error formatting (e.g., `text-danger` styling)

#### Scenario: Empty state persists when no entries

- **WHEN** viewing `/audit-log` with an empty `audit_log` sheet
- **THEN** the table body shows the message "No audit entries yet" / "Aún no hay entradas de auditoría"
