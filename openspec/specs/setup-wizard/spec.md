# setup-wizard Specification

## Purpose

Guide authenticated users without an active shop through creating or opening a shop before using the app.

## Requirements

### Requirement: Wizard modal appears when no active shop is set

The system SHALL display a full-screen modal overlay (the setup wizard) whenever the user is authenticated but has no active shop selected. The modal SHALL prevent interaction with the app content behind it.

#### Scenario: Authenticated user with no active shop sees wizard
- **WHEN** an authenticated user loads the app
- **AND** no active shop exists in the shop store
- **THEN** the wizard modal appears over the Layout

#### Scenario: Wizard is dismissed when active shop is set
- **WHEN** the wizard completes (shop created or opened)
- **AND** the shop store has an active shop
- **THEN** the wizard modal disappears and the app is usable

### Requirement: Step 1 presents create-or-open choice

The wizard's first step SHALL present two options: "Create new shop" and "Open existing folder". A "Cancel" button SHALL also be visible.

#### Scenario: User sees action choice
- **WHEN** the wizard renders step 1
- **THEN** the user sees buttons for "Create new shop", "Open existing folder", and "Cancel"

#### Scenario: Cancel logs the user out
- **WHEN** the user clicks "Cancel" on step 1
- **THEN** the auth store's `logout()` is called and the user is redirected to `/login`

### Requirement: Create-new-shop step collects a folder name

When the user chooses "Create new shop", the wizard SHALL show a text input for the folder name. The user SHALL be able to type any name they want. A "Create" button submits, a "Back" button returns to step 1.

#### Scenario: User enters folder name and creates shop
- **WHEN** the user types a folder name and clicks "Create"
- **THEN** the system creates a Drive folder with that name, a spreadsheet inside it, and a metadata file

#### Scenario: User goes back from create step
- **WHEN** the user clicks "Back" on the create-new-shop step
- **THEN** the wizard returns to step 1

#### Scenario: Empty folder name is rejected
- **WHEN** the user clicks "Create" with an empty folder name
- **THEN** the system shows a validation error and does not proceed

### Requirement: Creation step shows progress and handles errors

While creating the shop, the wizard SHALL show a loading state. If creation fails, the wizard SHALL display an error message and allow retrying.

#### Scenario: Loading state during creation
- **WHEN** the system is creating the folder, spreadsheet, and metadata
- **THEN** the wizard shows a loading/progress indicator

#### Scenario: Creation error is displayed
- **WHEN** folder, spreadsheet, or metadata creation fails
- **THEN** the wizard shows an error message with a retry option

### Requirement: Success step shows congratulations after creating a shop

After successful shop creation, the wizard SHALL show a summary with a congratulations message. The step SHALL include: an "X" close button, a disabled "Start tour" button, and a "Continue" button.

#### Scenario: Congratulations screen after creation
- **WHEN** the shop is successfully created
- **THEN** the wizard shows a congratulations message with the folder name

#### Scenario: Continue button dismisses wizard
- **WHEN** the user clicks "Continue" on the success step
- **THEN** the wizard closes and the app loads with the new active shop

#### Scenario: X button dismisses wizard
- **WHEN** the user clicks the "X" close button on the success step
- **THEN** the wizard closes and the app loads with the new active shop

#### Scenario: Start tour button is disabled
- **WHEN** the success step renders
- **THEN** the "Start tour" button is visible but disabled (not clickable)

### Requirement: Open-existing step launches Google Picker for folder selection

When the user chooses "Open existing folder", the system SHALL open the Google Picker configured to select folders only. A "Back" button SHALL return to step 1. Additionally, the system SHALL provide a folder ID text input as an alternative to the Picker, allowing users to paste a Google Drive folder ID directly.

#### Scenario: Google Picker opens for folder selection
- **WHEN** the user clicks "Open existing folder"
- **THEN** the Google Picker opens allowing the user to select a folder from their Drive

#### Scenario: User cancels Picker
- **WHEN** the user closes the Google Picker without selecting a folder
- **THEN** the wizard returns to step 1

#### Scenario: User enters folder ID manually
- **WHEN** the user types or pastes a Google Drive folder ID into the folder ID input and submits
- **THEN** the system validates the folder using the same validation flow as Picker-selected folders

#### Scenario: Empty folder ID is rejected
- **WHEN** the user submits the folder ID input with an empty value
- **THEN** the system shows a validation error and does not proceed

#### Scenario: Folder ID input includes helper text
- **WHEN** the folder ID input renders
- **THEN** helper text is visible explaining where to find the folder ID (e.g., from the Google Drive URL)

### Requirement: Selected folder is validated before opening

After the user selects a folder via Picker or enters a folder ID manually, the system SHALL validate that the folder contains a valid `illo3d.metadata.json` file, that the metadata's major version matches the app's major version, and that the spreadsheet referenced in the metadata is accessible with read-write permissions.

#### Scenario: Valid folder opens immediately
- **WHEN** the user selects a valid folder (metadata present, version compatible, spreadsheet accessible)
- **THEN** the shop is set as active and the app loads directly (no summary step)

#### Scenario: Missing metadata file
- **WHEN** the selected folder does not contain `illo3d.metadata.json`
- **THEN** the wizard shows an error: "This folder is not an illo3d shop"

#### Scenario: Incompatible major version
- **WHEN** the metadata's major version differs from the app's major version
- **THEN** the wizard shows an error indicating version incompatibility

#### Scenario: Spreadsheet not accessible
- **WHEN** the spreadsheet referenced in the metadata cannot be read or written
- **THEN** the wizard shows an error indicating insufficient permissions

#### Scenario: Validation error allows retrying
- **WHEN** any validation error occurs
- **THEN** the user can go back to step 1 and try again

### Requirement: Wizard UI strings support i18n

All user-facing text in the wizard (buttons, titles, messages, errors) SHALL use i18next translation keys.

#### Scenario: Wizard text is translatable
- **WHEN** the wizard renders any step
- **THEN** all visible text is sourced from i18n keys (e.g., `wizard.createNew`, `wizard.openExisting`, `wizard.cancel`)
