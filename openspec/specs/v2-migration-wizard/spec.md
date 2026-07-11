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
- **AND** the modal SHALL display a StepGrid showing entity cards with their migration status

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

### Requirement: Step grid shows entity status

The migration wizard modal SHALL display a StepGrid component between the description text and the action buttons. Each StepCard in the grid SHALL represent one entity sheet. Each card SHALL display a status from the migration status config: `pending` (grey), `running` (blue), `done` (green).

#### Scenario: All entities shown as pending initially

- **WHEN** the migration wizard modal first renders
- **THEN** the StepGrid contains 12 StepCards, one per entity (backup + 11 data entities)
- **AND** all cards have `status="pending"` (grey background, grey icon)

#### Scenario: Entity names are labeled

- **WHEN** the migration wizard modal renders the StepGrid
- **THEN** the cards use labels: Backup, Clients, CRM Notes, Tags, Tag Links, Jobs, Pieces, Piece Items, Inventory, Lots, Transactions, Audit Log

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

- **WHEN** the modal renders with done entities
- **THEN** the summary line above the grid shows "{done} of {total} done"
- **AND** when all entities are done, the summary shows "All done"

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
- **THEN** the backup card shows a shield icon
- **AND** the clients card shows a users icon
- **AND** the jobs card shows a briefcase icon
- **AND** the inventory card shows a warehouse icon
- **AND** the transactions card shows a coins icon
- **AND** the audit_log card shows a clipboard icon
- **AND** all other entity cards show appropriate icons

### Requirement: Backup question banner appears in modal

The migration wizard modal SHALL display a backup question banner between the description block and the StepGrid. The banner SHALL contain a shield icon, the question text, and two buttons: "Yes, back up my shop" and "No, skip backup".

#### Scenario: Backup banner is visible

- **WHEN** the migration wizard modal is displayed
- **THEN** a banner with shield icon SHALL appear between the description paragraph and the StepGrid
- **AND** the banner SHALL contain a question and two buttons (Yes/No)

### Requirement: Yes/No buttons have toggle behavior

The Yes and No buttons SHALL be togglable. Clicking one selects it (highlighted), clicking the other selects that one instead. Clicking the already-selected button deselects it (returning to "no answer" state).

#### Scenario: Yes selected on click

- **WHEN** the user clicks "Yes"
- **THEN** the Yes button SHALL have a green background with white text
- **AND** the No button SHALL have a dimmed/grey appearance

#### Scenario: No selected on click

- **WHEN** the user clicks "No"
- **THEN** the No button SHALL have an amber background with white text
- **AND** the Yes button SHALL have a dimmed/grey appearance

#### Scenario: Toggle between Yes and No

- **WHEN** "Yes" is selected and the user clicks "No"
- **THEN** "No" becomes selected (amber) and "Yes" becomes dimmed
- **WHEN** "No" is selected and the user clicks "Yes"
- **THEN** "Yes" becomes selected (green) and "No" becomes dimmed

#### Scenario: Clicking selected button deselects

- **WHEN** "Yes" is selected and the user clicks "Yes" again
- **THEN** both buttons return to neutral state (neither selected)
- **WHEN** "No" is selected and the user clicks "No" again
- **THEN** both buttons return to neutral state (neither selected)

### Requirement: Warning shown when No is selected

When the user selects "No", a warning paragraph SHALL appear below the buttons.

#### Scenario: Warning appears on No

- **WHEN** the user selects "No" on the backup question
- **THEN** a warning paragraph SHALL appear below the buttons recommending a manual backup

#### Scenario: Warning disappears on Yes or deselect

- **WHEN** the warning is visible and the user selects "Yes"
- **THEN** the warning text SHALL be removed
- **WHEN** the warning is visible and the user deselects "No"
- **THEN** the warning text SHALL be removed

### Requirement: Continue button has cooldown timer with progress indicator

The Continue button SHALL remain disabled until the backup question is answered AND a 5-second cooldown timer has elapsed since the last answer change. During the cooldown, a circular progress indicator SHALL animate around the button's text. When the cooldown completes, the progress indicator SHALL be replaced by a checkmark icon. Changing the answer SHALL reset the cooldown timer and progress.

#### Scenario: Continue disabled until cooldown

- **WHEN** the migration wizard modal first renders
- **THEN** the Continue button SHALL be disabled
- **WHEN** the user answers the backup question (Yes or No)
- **THEN** the Continue button SHALL remain disabled for 5 seconds
- **AND** a circular progress indicator SHALL animate during the cooldown
- **WHEN** 5 seconds have elapsed since the last answer
- **THEN** the Continue button SHALL become enabled
- **AND** a checkmark icon SHALL replace the progress indicator

#### Scenario: Changing answer resets cooldown

- **WHEN** 5 seconds have elapsed and the Continue button is enabled
- **AND** the user changes the backup answer
- **THEN** the Continue button SHALL become disabled again
- **AND** the cooldown timer SHALL restart from 0 seconds
- **AND** the progress indicator SHALL reset and animate again

### Requirement: Backup card reflects skip state

When the user selects "No, skip backup", the backup entity card SHALL transition to the `done` status with a green visual and display the subtitle "Skipped". The steps summary SHALL update to show 1 of 12 done.

#### Scenario: Backup marked done when skipped

- **WHEN** the user selects "No" on the backup question
- **THEN** the backup card in the StepGrid SHALL show `status="done"` (green background, green icon, checkmark)
- **AND** the backup card SHALL display the subtitle "Skipped"
- **AND** the step summary SHALL update to "1 of 12 done"

#### Scenario: Backup stays pending when Yes is selected

- **WHEN** the user selects "Yes" on the backup question
- **THEN** the backup card SHALL remain `status="pending"` (grey)
- **AND** the step summary SHALL show "0 of 12 done"

### Requirement: Action buttons are right-aligned on desktop, stacked on mobile

The modal action buttons (Continue, Log out) SHALL be right-aligned on desktop and stacked with `flex-col-reverse` on mobile (Continue on bottom-first for thumb reach).

#### Scenario: Desktop button layout

- **WHEN** the modal is viewed on a screen >= 640px
- **THEN** Continue and Log out SHALL be horizontally arranged with right alignment
- **AND** Continue SHALL be to the right of Log out

#### Scenario: Mobile button layout

- **WHEN** the modal is viewed on a screen < 640px
- **THEN** Continue and Log out SHALL be stacked vertically
- **AND** Continue SHALL appear above Log out in visual order

### Requirement: Backup UI strings are i18n

All user-facing strings for the backup feature SHALL use i18next translation keys with both English and Spanish translations.

#### Scenario: Strings are translatable

- **WHEN** the backup banner renders
- **THEN** all backup-related text is sourced from i18n keys
- **AND** Spanish translations SHALL be provided alongside English
