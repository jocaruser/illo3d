# v2-migration-wizard Specification

## Purpose

When the app's major version differs from a shop's metadata version, the setup wizard shows a migration wizard modal instead of a static error. The modal displays the version mismatch (current vs. target), has a disabled Continue button (placeholder for future migration), and a Log out action that clears state and returns to the welcome screen.

## Requirements

### Requirement: Validation returns version metadata on mismatch

The `validateShopFolder` function SHALL return the shop's version string and the app's version string when validation fails due to a major version mismatch.

#### Scenario: Version error includes shop and app version

- **WHEN** `validateShopFolder` detects an incompatible major version
- **THEN** the result SHALL contain `error: 'version'`, `shopVersion` (the raw version from `illo3d.metadata.json`), and `appVersion` (the raw `APP_VERSION` constant)

### Requirement: Migration wizard modal appears on version mismatch

When the setup wizard detects a version mismatch (Google Drive paste ID or local folder picker), the system SHALL display a modal overlay titled "Migration Wizard" showing the shop version, the app version, a StepGrid with per-entity migration status, a disabled "Continue" button, and a "Log out" button.

#### Scenario: Modal shows version information and step grid

- **WHEN** a version mismatch is detected during shop validation
- **THEN** a modal SHALL appear with title "Migration Wizard"
- **AND** the modal SHALL display the current shop version and the target app version
- **AND** the modal SHALL display a StepGrid showing all 11 entity cards with their migration status

#### Scenario: Step grid appears between description and buttons

- **WHEN** the migration wizard modal is displayed
- **THEN** the description paragraph SHALL appear between the version comparison and the step grid
- **AND** the step grid SHALL appear between the description paragraph and the action buttons

#### Scenario: Continue button is disabled

- **WHEN** the migration wizard modal is displayed
- **THEN** the "Continue" button SHALL be present but visually disabled and non-interactive

#### Scenario: Log out clears state and returns to welcome

- **WHEN** the user clicks "Log out" on the migration wizard modal
- **THEN** `authStore.logout()`, `shopStore.clearActiveShop()`, and `backendStore.clearBackend()` SHALL be called
- **AND** the modal SHALL close
- **AND** the wizard SHALL return to the welcome screen

#### Scenario: Modal follows existing overlay pattern

- **WHEN** the migration wizard modal renders
- **THEN** it SHALL use the same z-index (`z-60`), backdrop (`bg-black/40`), and dialog attributes (`role="dialog"`, `aria-modal="true"`) as the `CreateConfirmModal`

#### Scenario: Local folder path triggers same modal

- **WHEN** a version mismatch is detected via the local directory picker path
- **THEN** the same migration wizard modal SHALL appear
- **AND** the behavior of "Log out" SHALL be identical to the Google Drive path

### Requirement: Modal UI strings are i18n

All user-facing strings in the migration wizard modal SHALL use i18next translation keys.

#### Scenario: Strings are translatable

- **WHEN** the modal renders
- **THEN** all visible text is sourced from i18n keys: `wizard.migrationTitle`, `wizard.migrationShopVersion`, `wizard.migrationAppVersion`, `wizard.migrationContinue`, `wizard.migrationLogOut`, `wizard.migrationSummary`, `wizard.migrationAllDone`

## ADDED Requirements

### Requirement: Step grid shows entity status

The migration wizard modal SHALL display a StepGrid component between the description text and the action buttons. Each StepCard in the grid SHALL represent one entity sheet. Each card SHALL display a status from the migration status config: `pending` (grey), `running` (blue), `done` (green).

#### Scenario: All entities shown as pending initially

- **WHEN** the migration wizard modal first renders
- **THEN** the StepGrid contains 11 StepCards, one per entity
- **AND** all cards have `status="pending"` (grey background, grey icon)

#### Scenario: Entity names match SHEET_NAMES

- **WHEN** the migration wizard modal renders the StepGrid
- **THEN** the cards use entity labels from SHEET_NAMES: clients, crm_notes, tags, tag_links, jobs, pieces, piece_items, inventory, lots, transactions, audit_log

### Requirement: Step grid statuses are data-driven

The migration wizard modal SHALL NOT manage status transitions internally. It SHALL accept items with their current status as props. The parent (SetupWizard or a future migration hook) SHALL control when statuses change.

#### Scenario: Statuses passed as props

- **WHEN** the migration wizard modal renders
- **THEN** the item statuses come from a prop or state managed by the parent component
- **AND** changing a status in the parent causes the card to re-render with the new visual style

### Requirement: Modal explains what changed in v2

The migration wizard modal SHALL display a paragraph explaining the v2 breaking changes in user-friendly language. The paragraph SHALL appear between the version comparison display and the step grid (see `#### Scenario: Step grid appears between description and buttons`). The text SHALL NOT use technical jargon (e.g., "SHEET_HEADERS", "schema") and SHALL be understandable to an end user.

#### Scenario: Breaking changes are described

- **WHEN** the migration wizard modal is displayed due to a version mismatch
- **THEN** the modal SHALL show a description paragraph between the version numbers and the buttons
- **AND** the paragraph SHALL explain that version 2 adds audit logging (a record of changes) and archived/deleted tracking on items
- **AND** the paragraph SHALL state that shops created in version 1 need an update to work with the new structure

### Requirement: Modal explains what the migration will do

The migration wizard modal SHALL display a paragraph explaining what will happen when the user continues with the migration. The paragraph SHALL list the specific changes the migration will make to the user's shop and SHALL reassure the user that no data will be removed.

#### Scenario: Migration actions are described

- **WHEN** the migration wizard modal is displayed
- **THEN** the modal SHALL show a paragraph explaining that the migration will:
  - Add the audit log sheet to track all future changes
  - Add the missing archived/deleted columns
  - Populate the audit log with entries for existing items (recording them as present at migration time)
- **AND** the paragraph SHALL state that no data will be removed

### Requirement: Description text supports i18n

All user-facing description text SHALL use i18next translation keys.

#### Scenario: Description strings are translatable

- **WHEN** the migration wizard modal renders
- **THEN** all new description text SHALL be sourced from i18n keys
- **AND** Spanish translations SHALL be provided alongside English

### Requirement: Step summary shows progress count

The migration wizard modal SHALL display a summary line above the StepGrid showing how many entities have been processed.

#### Scenario: Summary shows count

- **WHEN** the modal renders with 3 of 11 entities marked as `done`
- **THEN** the summary line above the grid shows "3 of 11 done"
- **AND** when all 11 are done, the summary shows "All done"

### Requirement: Grid is responsive within the modal

The StepGrid inside the migration wizard modal SHALL adapt to the modal's width: 2 columns on narrow viewports, 3 on tablet, 4 on desktop.

#### Scenario: Grid columns adapt to modal width

- **WHEN** the modal is viewed on a narrow screen (< 640px)
- **THEN** the grid displays 2 columns
- **WHEN** the modal is viewed on a screen 640–768px
- **THEN** the grid displays 3 columns
- **WHEN** the modal is viewed on a screen > 768px
- **THEN** the grid displays 4 columns

### Requirement: Step cards show entity icons

Each StepCard in the migration StepGrid SHALL display an SVG icon that represents the entity type.

#### Scenario: Each entity has a distinct icon

- **WHEN** the migration wizard modal renders
- **THEN** the clients card shows a users icon
- **AND** the jobs card shows a briefcase icon
- **AND** the inventory card shows a warehouse icon
- **AND** the transactions card shows a coins icon
- **AND** the audit_log card shows a clipboard icon
- **AND** all other entity cards show appropriate icons
