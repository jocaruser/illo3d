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

The system SHALL display a full-screen modal overlay (the setup wizard) whenever no active shop is selected, regardless of authentication state. The wizard is the sole entry point for new and returning users without a persisted shop. The modal SHALL prevent interaction with the app content behind it.

#### Scenario: User with no active shop sees wizard

- **WHEN** a user loads the app
- **AND** no active shop exists in the shop store
- **THEN** the wizard modal appears over the Layout

#### Scenario: Wizard is dismissed when active shop is set

- **WHEN** the wizard completes (shop created or opened)
- **AND** the shop store has an active shop
- **THEN** the wizard modal disappears and the app is usable

#### Scenario: Returning user with persisted shop skips wizard

- **WHEN** a user loads the app
- **AND** an active shop exists in sessionStorage
- **THEN** the wizard does not appear and the dashboard loads directly

### Requirement: Welcome screen presents backend selection with immediate action

The wizard's welcome screen SHALL present two backend options: "Local folder" and "Google Drive". Each option SHALL include a brief description of its characteristics. Clicking either option SHALL trigger immediate action (directory picker for local, OAuth popup for Google Drive). There SHALL be no intermediate "Create or Open" decision for local files.

#### Scenario: User sees backend selection options

- **WHEN** the wizard renders the welcome screen
- **THEN** the user sees two options: "Local folder" (with "Files stay on your computer. Chrome required.") and "Google Drive" (with "Synced to your Google account. Access anywhere.")

#### Scenario: Clicking Local folder opens directory picker immediately

- **WHEN** the user clicks "Local folder"
- **THEN** the OS directory picker opens immediately via `showDirectoryPicker()`
- **AND** no intermediate screen is shown

#### Scenario: Clicking Google Drive starts OAuth immediately

- **WHEN** the user clicks "Google Drive"
- **THEN** the Google OAuth popup opens immediately requesting profile, `drive.file`, and sheets scopes
- **AND** no intermediate screen is shown

### Requirement: Smart folder detection for Local Files

After the user selects a folder via the directory picker, the system SHALL read the folder contents and determine the action automatically. If `illo3d.metadata.json` exists, validate and open. If not, show a confirmation modal offering to create a new shop.

#### Scenario: Folder with valid metadata opens as existing shop

- **WHEN** the user selects a folder via the directory picker
- **AND** the folder contains `illo3d.metadata.json` with a compatible major version
- **THEN** the system validates the shop structure and opens it
- **AND** the user lands on the dashboard

#### Scenario: Folder with incompatible metadata version shows error

- **WHEN** the user selects a folder via the directory picker
- **AND** the folder contains `illo3d.metadata.json` with an incompatible major version
- **THEN** the system shows a version incompatibility error
- **AND** the user can try again from the welcome screen

#### Scenario: Folder without metadata shows create confirmation

- **WHEN** the user selects a folder via the directory picker
- **AND** the folder does not contain `illo3d.metadata.json`
- **THEN** a confirmation modal appears: "Create a new illo3d shop in '<folder-name>'? Existing shop files will be overwritten."

#### Scenario: User confirms shop creation

- **WHEN** the user clicks "Create" on the confirmation modal
- **THEN** the system scaffolds shop files (metadata + CSVs) in the folder
- **AND** the user lands on the dashboard

#### Scenario: User cancels shop creation

- **WHEN** the user clicks "Cancel" on the confirmation modal
- **THEN** the modal closes and the user returns to the welcome screen

#### Scenario: User cancels directory picker

- **WHEN** the user dismisses the OS directory picker without selecting a folder
- **THEN** the user returns to the welcome screen

### Requirement: Google Drive screen shows create/open after OAuth

After successful Google OAuth, the system SHALL display a screen with the user's name and avatar, a "Create new shop" button, an "Open existing" button (Drive folder picker), and a folder-ID text input. The screen SHALL include a warning about `drive.file` scope limitations. A "Cancel" button SHALL log the user out and return to the welcome screen.

#### Scenario: Google Drive screen renders after OAuth

- **WHEN** Google OAuth completes successfully
- **THEN** the user sees their name and avatar
- **AND** sees "Create new shop" and "Open existing" buttons
- **AND** sees a folder-ID text input with helper text
- **AND** sees a `drive.file` scope warning explaining cross-device access limitations

#### Scenario: Create new shop on Google Drive

- **WHEN** the user clicks "Create new shop" on the Google Drive screen
- **THEN** the system creates a new Drive folder, spreadsheet, and metadata
- **AND** the user lands on the dashboard

#### Scenario: Open existing via Drive picker

- **WHEN** the user clicks "Open existing" on the Google Drive screen
- **THEN** the Google Drive folder picker opens
- **AND** on folder selection, the system validates and opens the shop

#### Scenario: Open existing via folder ID

- **WHEN** the user pastes a folder ID and clicks "Open"
- **THEN** the system validates the folder and opens the shop

#### Scenario: Empty folder ID is rejected

- **WHEN** the user clicks "Open" with an empty folder ID field
- **THEN** the system shows a validation error

#### Scenario: Cancel on Google Drive screen logs out

- **WHEN** the user clicks "Cancel" on the Google Drive screen
- **THEN** auth, shop, and backend state are cleared
- **AND** the user returns to the welcome screen

#### Scenario: User cancels Google folder picker without selection

- **WHEN** the user closes the Google Picker without selecting a folder
- **THEN** the user remains on the Google Drive screen (or returns to welcome per product rules)

### Requirement: Cancel on any wizard screen performs full logout

Pressing cancel on any wizard screen SHALL clear `authStore`, `shopStore`, and `backendStore` state, and return the user to the wizard welcome screen. This applies to both local-files and Google Drive flows.

#### Scenario: Cancel clears all state

- **WHEN** the user clicks "Cancel" on any wizard screen
- **THEN** `authStore.logout()` is called
- **AND** `shopStore.clearActiveShop()` is called
- **AND** `backendStore` is reset
- **AND** the wizard returns to the welcome screen

### Requirement: Shop name is hardcoded to "illo3d"

The system SHALL use "illo3d" as the shop folder name for new shops. No shop-name input step SHALL be presented in the wizard.

#### Scenario: New shop uses hardcoded name

- **WHEN** a new shop is created (local or Google Drive)
- **THEN** the folder/metadata uses "illo3d" as the shop name

### Requirement: Creation step shows progress and handles errors

While creating the shop (folder, spreadsheet, metadata, or local CSV scaffold), the wizard SHALL show a loading state. If creation fails, the wizard SHALL display an error message and allow retrying.

#### Scenario: Loading state during creation

- **WHEN** the system is creating the folder, spreadsheet, and metadata
- **THEN** the wizard shows a loading/progress indicator

#### Scenario: Creation error is displayed

- **WHEN** folder, spreadsheet, or metadata creation fails
- **THEN** the wizard shows an error message with a retry option

### Requirement: Selected folder is validated before opening

After the user selects a folder via Picker, directory picker, or enters a folder ID manually (Google), the system SHALL validate that the folder contains a valid `illo3d.metadata.json` when opening an existing shop, that the metadata's major version matches the app's major version, and that the spreadsheet referenced in the metadata is accessible with read-write permissions (Google Drive).

#### Scenario: Valid folder opens immediately

- **WHEN** the user selects a valid folder (metadata present, version compatible, spreadsheet accessible where applicable)
- **THEN** the shop is set as active and the app loads directly (no separate congratulations step)

#### Scenario: Open existing with missing metadata (Google)

- **WHEN** the user attempts to open a Drive folder that does not contain `illo3d.metadata.json`
- **THEN** the wizard shows an error indicating the folder is not a valid illo3d shop

#### Scenario: Incompatible major version

- **WHEN** the metadata's major version differs from the app's major version
- **THEN** the wizard shows an error indicating version incompatibility

#### Scenario: Spreadsheet not accessible

- **WHEN** the spreadsheet referenced in the metadata cannot be read or written
- **THEN** the wizard shows an error indicating insufficient permissions

#### Scenario: Validation error allows retrying

- **WHEN** any validation error occurs on the Google Drive screen
- **THEN** the user can retry or return to the welcome screen

### Requirement: Wizard UI strings support i18n

All user-facing text in the wizard (buttons, titles, messages, errors) SHALL use i18next translation keys.

#### Scenario: Wizard text is translatable

- **WHEN** the wizard renders any step
- **THEN** all visible text is sourced from i18n keys (e.g., `wizard.createNew`, `wizard.openExisting`, `wizard.cancel`)
