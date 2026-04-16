# shop-lifecycle Specification

## Purpose

Shop identity, metadata, and version compatibility for illo3d, plus the setup wizard that creates or opens a shop (Google Drive or Local CSV) before the user can use the app.

## Shop model and metadata

### Requirement: Shop data model exists

The system SHALL define a `Shop` type containing: `folderId` (string), `folderName` (string), `spreadsheetId` (string), and `metadataVersion` (string).

#### Scenario: Shop type is available for use

- **WHEN** any module needs to reference a shop
- **THEN** it can import the `Shop` type with all required fields

### Requirement: Active shop state is managed in a store

The system SHALL maintain an `activeShop` state in a Zustand store persisted to `sessionStorage`. The store SHALL expose `setActiveShop(shop)` and `clearActiveShop()` actions.

#### Scenario: Setting active shop

- **WHEN** the wizard successfully creates or opens a shop
- **THEN** the active shop is set in the store and persisted to sessionStorage

#### Scenario: Clearing active shop

- **WHEN** the user logs out
- **THEN** the active shop is cleared from the store and sessionStorage

#### Scenario: Active shop survives page refresh

- **WHEN** the user refreshes the page within the same browser session
- **THEN** the active shop is restored from sessionStorage

### Requirement: Metadata file follows a defined schema

The `illo3d.metadata.json` file SHALL contain: `app` (literal string `"illo3d"`), `version` (semver string), `spreadsheetId` (string), `createdAt` (ISO 8601 date string), and `createdBy` (email string).

#### Scenario: Metadata file is written with all fields

- **WHEN** the wizard creates a new shop
- **THEN** `illo3d.metadata.json` is written with `app`, `version`, `spreadsheetId`, `createdAt`, and `createdBy` fields

#### Scenario: Metadata file is validated on read

- **WHEN** the system reads a metadata file
- **THEN** it validates that all required fields are present and correctly typed

### Requirement: App version constant is maintained

The system SHALL expose an `APP_VERSION` constant (semver string) in `src/config/version.ts`. This constant SHALL be manually bumped following semver conventions. The addition of lifecycle columns (`archived`, `deleted`) to `SHEET_HEADERS` constitutes a breaking schema change and SHALL be accompanied by a **major version bump**.

#### Scenario: APP_VERSION is accessible

- **WHEN** any module needs the current app version
- **THEN** it imports `APP_VERSION` from `@/config/version`

#### Scenario: Major version bumped for schema change

- **WHEN** the release adds lifecycle columns to `SHEET_HEADERS`
- **THEN** `APP_VERSION` major is incremented (e.g. `1.x.x` to `2.0.0`)

### Requirement: Version compatibility check uses semver major

The system SHALL compare the major version of the app's `APP_VERSION` with the major version in the metadata file. If the major versions differ, the system SHALL refuse to open the shop and show an error. Workbooks created before the lifecycle column addition SHALL fail this check after the major bump.

#### Scenario: Same major version is compatible

- **WHEN** app version is `2.1.0` and metadata version is `2.0.0`
- **THEN** the shop is considered compatible and can be opened

#### Scenario: Different major version is incompatible

- **WHEN** app version is `2.0.0` and metadata version is `1.5.0`
- **THEN** the shop is considered incompatible and the system shows a version error

#### Scenario: Same major version with higher minor in metadata

- **WHEN** app version is `2.0.0` and metadata version is `2.3.0`
- **THEN** the shop is considered compatible (same major)

### Requirement: Shop open includes workbook hydration

After metadata validation and structure validation succeed, the shop open flow SHALL **hydrate the workbook snapshot store** with all tab data before transitioning to the main app. The user SHALL see a loading indicator during hydration. If hydration fails, the shop open SHALL fail with an error.

#### Scenario: Workbook hydrated after validation

- **WHEN** the setup wizard completes and validation passes
- **THEN** the workbook store is populated with all tab data
- **AND** the app transitions to the main layout

#### Scenario: Hydration failure blocks app

- **WHEN** workbook hydration fails (e.g. network error reading tabs)
- **THEN** the app shows an error
- **AND** the main layout is NOT rendered

## Setup wizard

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
