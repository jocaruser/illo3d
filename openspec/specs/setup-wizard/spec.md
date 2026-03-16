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

### Requirement: Step 1 presents storage and action choice

The wizard's first step SHALL present a storage choice (Local CSV | Google Drive) in a top row and an action choice (Create new shop | Open existing shop) in a row below. Both actions SHALL be enabled for both backends. A "Cancel" button SHALL also be visible. The wizard SHALL NOT hide options based on dev mode.

#### Scenario: User sees storage and action choices
- **WHEN** the wizard renders step 1
- **THEN** the user sees storage options (Local CSV, Google Drive)
- **AND** sees action options (Create new shop, Open existing shop)
- **AND** both actions are available regardless of build mode

#### Scenario: User selects storage then action
- **WHEN** the user selects a storage option (Local CSV or Google Drive)
- **AND** clicks an action (Create new shop or Open existing shop)
- **THEN** the wizard proceeds to the corresponding step with the selected backend

#### Scenario: Cancel logs the user out
- **WHEN** the user clicks "Cancel" on step 1
- **THEN** the auth store's `logout()` is called and the user is redirected to `/login`

### Requirement: Create-new-shop step collects a folder name (Google) or uses directory picker (Local CSV)

When the user chooses "Create new shop" with Google Drive, the wizard SHALL show a text input for the folder name. When the user chooses "Create new shop" with Local CSV, the wizard SHALL use the File System Access API directory picker instead of a folder name input.

#### Scenario: User enters folder name and creates Google shop
- **WHEN** the user selects Google Drive and clicks "Create new shop"
- **THEN** the wizard shows a folder name input
- **AND** when the user types a name and clicks "Create", the system creates a Drive folder with that name, a spreadsheet inside it, and a metadata file

#### Scenario: User selects folder and creates Local CSV shop
- **WHEN** the user selects Local CSV and clicks "Create new shop"
- **AND** the browser supports File System Access API
- **THEN** the system opens the directory picker
- **AND** after the user selects a folder, creates metadata and CSV files there

#### Scenario: User goes back from create step
- **WHEN** the user clicks "Back" on the create-new-shop step
- **THEN** the wizard returns to step 1

#### Scenario: Empty folder name is rejected (Google)
- **WHEN** the user clicks "Create" with an empty folder name (Google Drive flow)
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

### Requirement: Open-existing step adapts to backend

When the user chooses "Open existing shop", the wizard SHALL adapt the selection UI to the selected backend. For Google Drive: Picker and folder ID input. For Local CSV: File System Access API directory picker; in dev mode, a fixture folder name input MAY be shown as fallback.

#### Scenario: Google Drive opens Picker or folder ID input
- **WHEN** the user selects Google Drive and clicks "Open existing shop"
- **THEN** the wizard shows the Google Picker and folder ID input
- **AND** user can select a folder via Picker or paste a folder ID

#### Scenario: Local CSV opens directory picker
- **WHEN** the user selects Local CSV and clicks "Open existing shop"
- **AND** the browser supports File System Access API
- **THEN** the wizard opens the directory picker
- **AND** user selects a folder containing a valid illo3d shop

#### Scenario: Dev mode shows fixture folder name input (Local CSV fallback)
- **WHEN** the wizard "Open existing" step renders for Local CSV in dev mode
- **AND** File System Access API is unavailable or as fallback
- **THEN** a text input for fixture folder name MAY be shown (e.g. `happy-path`, `missingcolumn`)

#### Scenario: User cancels Picker
- **WHEN** the user closes the Google Picker without selecting a folder
- **THEN** the wizard returns to step 1

#### Scenario: User enters folder ID manually (Google Drive)
- **WHEN** the user types or pastes a Google Drive folder ID into the folder ID input and submits
- **THEN** the system validates the folder using the same validation flow as Picker-selected folders

#### Scenario: Empty folder ID is rejected
- **WHEN** the user submits the folder ID input with an empty value
- **THEN** the system shows a validation error and does not proceed

#### Scenario: Folder ID input includes helper text
- **WHEN** the folder ID input renders (Google Drive)
- **THEN** helper text is visible explaining where to find the folder ID (e.g., from the Google Drive URL)

### Requirement: Selected folder is validated before opening

After the user selects a folder via Picker, directory picker, or enters a folder ID manually, the system SHALL validate that the folder contains a valid `illo3d.metadata.json` file, that the metadata's major version matches the app's major version, and that the spreadsheet referenced in the metadata is accessible with read-write permissions.

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
