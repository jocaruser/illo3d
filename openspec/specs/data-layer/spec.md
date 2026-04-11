# data-layer Specification

## Purpose

Persistent data access for illo3d: Google Drive and Picker for shop folders and metadata, Google Sheets as the production tabular backend, repository abstractions swappable by backend choice (Google Drive vs Local CSV), CSV fixtures for dev/tests, append/write behavior, and Local CSV creation/opening via the File System Access API. This boundary is the natural candidate for a future extraction to a dedicated service.

## Google Drive API

### Requirement: Drive folders can be created

The system SHALL be able to create a folder in the user's Google Drive via the Drive API v3. The folder name SHALL be whatever the user specified in the wizard.

#### Scenario: Create a new Drive folder

- **WHEN** the wizard requests folder creation with a given name
- **THEN** a new folder is created in the user's Drive root with that name
- **AND** the folder ID is returned for subsequent operations

### Requirement: Files can be uploaded to a Drive folder

The system SHALL be able to upload a JSON file (`illo3d.metadata.json`) into a specific Drive folder. The file SHALL have MIME type `application/json`.

#### Scenario: Upload metadata file to folder

- **WHEN** the system uploads `illo3d.metadata.json` to a folder
- **THEN** the file is created inside that folder with correct content and MIME type

### Requirement: Files can be read from a Drive folder

The system SHALL be able to list files in a Drive folder and read the content of `illo3d.metadata.json` by searching for files with that name within the folder.

#### Scenario: Read metadata from a folder

- **WHEN** the system requests the metadata file from a folder ID
- **THEN** it searches for `illo3d.metadata.json` in that folder
- **AND** returns the parsed JSON content

#### Scenario: Metadata file not found

- **WHEN** the folder does not contain `illo3d.metadata.json`
- **THEN** the system returns an error indicating the file is missing

### Requirement: Spreadsheet can be moved into a Drive folder

The system SHALL be able to move a newly created spreadsheet into a specific Drive folder using the Drive API (update file parents).

#### Scenario: Move spreadsheet into shop folder

- **WHEN** a spreadsheet is created and a folder ID is provided
- **THEN** the spreadsheet is moved into that folder (removed from root, added to folder)

### Requirement: Google Picker can select folders

The system SHALL integrate the Google Picker API to allow users to select a folder from their Drive. The Picker SHALL be configured to show only folders. The Picker SHALL use the `VITE_GOOGLE_API_KEY` environment variable.

#### Scenario: Picker opens in folder-only mode

- **WHEN** the system opens the Google Picker
- **THEN** the Picker displays only folders (not files)

#### Scenario: Picker returns selected folder

- **WHEN** the user selects a folder in the Picker
- **THEN** the system receives the folder ID and folder name

#### Scenario: Picker cancelled

- **WHEN** the user closes the Picker without selecting
- **THEN** the system receives a cancellation signal

### Requirement: Drive API uses existing OAuth credentials

The system SHALL reuse the Google OAuth credentials from `authStore` for all Drive API calls. No additional login or consent SHALL be required beyond the initial OAuth flow.

#### Scenario: Drive API calls are authenticated

- **WHEN** the system makes a Drive API request
- **THEN** it uses the access token from the auth store

### Requirement: Picker API key is configurable via environment

The system SHALL read the Google Picker API key from `VITE_GOOGLE_API_KEY`. The app SHALL NOT hardcode API keys.

#### Scenario: API key from env

- **WHEN** the system initializes the Google Picker
- **THEN** it uses `import.meta.env.VITE_GOOGLE_API_KEY`

## Shop folder repository

### Requirement: FolderRepository interface defines folder metadata contract

The system SHALL provide a `FolderRepository` interface with `readMetadata(folderId)` and `getFolderName(folderId)`. All shop folder metadata access used by the "Open existing" validation flow SHALL flow through this interface.

#### Scenario: Interface covers metadata read

- **WHEN** the system needs to read shop metadata from a folder
- **THEN** it calls `readMetadata(folderId)` on the repository
- **AND** receives `ShopMetadata | null` (app, version, spreadsheetId, createdAt, createdBy)

#### Scenario: Interface covers folder name

- **WHEN** the system needs the display name of a folder
- **THEN** it calls `getFolderName(folderId)` on the repository
- **AND** receives a string (folder name for display)

### Requirement: Repository selection is backend-driven

The system SHALL select the FolderRepository implementation based on the user's backend choice (from backendStore), not on `import.meta.env.DEV`. When backend is `local-csv` with a FileSystemDirectoryHandle, use LocalFolderRepository. When backend is `local-csv` with fixture folder name (dev only), use CsvFolderRepository. When backend is `google-drive`, use GoogleFolderRepository.

#### Scenario: Backend store selects LocalFolderRepository

- **WHEN** the backend store has `backend: 'local-csv'` and a FileSystemDirectoryHandle is set
- **THEN** getFolderRepository returns LocalFolderRepository
- **AND** readMetadata and getFolderName use the File System Access API

#### Scenario: Backend store selects CsvFolderRepository (fixtures)

- **WHEN** the backend store has `backend: 'local-csv'` and folderId is a fixture name (e.g. `happy-path`)
- **THEN** getFolderRepository returns CsvFolderRepository
- **AND** metadata is read from `/fixtures/<folderId>/illo3d.metadata.json`

#### Scenario: Backend store selects GoogleFolderRepository

- **WHEN** the backend store has `backend: 'google-drive'`
- **THEN** getFolderRepository returns GoogleFolderRepository
- **AND** readMetadata and getFolderName hit the Google Drive API

### Requirement: GoogleFolderRepository implements production backend

The system SHALL provide a `GoogleFolderRepository` that uses the Google Drive API for `readMetadata` and `getFolderName`. This implementation SHALL be used when backend is `google-drive`.

### Requirement: CsvFolderRepository implements dev backend

The system SHALL provide a `CsvFolderRepository` that fetches metadata from `/fixtures/<folderId>/illo3d.metadata.json` and returns the folderId as the folder name. This implementation SHALL be used when backend is `local-csv` and folderId is a fixture name (e.g. `happy-path`).

#### Scenario: getFolderName in dev mode

- **WHEN** getFolderName is called with folderId "happy-path"
- **THEN** CsvFolderRepository returns "happy-path" (or a display-friendly name)

### Requirement: LocalFolderRepository implements FolderRepository via File System Access API

The system SHALL provide a `LocalFolderRepository` that implements FolderRepository using a `FileSystemDirectoryHandle`. It SHALL read `illo3d.metadata.json` from the directory and return the handle's name for `getFolderName`. This implementation SHALL be used when the user selects a folder via `showDirectoryPicker` for Local CSV.

#### Scenario: LocalFolderRepository reads metadata from handle

- **WHEN** LocalFolderRepository.readMetadata is called with a valid handle
- **THEN** it reads `illo3d.metadata.json` from the directory
- **AND** returns ShopMetadata or null if not found

#### Scenario: LocalFolderRepository returns folder name

- **WHEN** LocalFolderRepository.getFolderName is called
- **THEN** it returns the directory handle's name for display

### Requirement: validateShopFolder uses FolderRepository

The system SHALL refactor `validateShopFolder` to call `FolderRepository.readMetadata` and `FolderRepository.getFolderName` instead of Drive API directly. validateStructure (Sheets) continues to use SheetsRepository.

#### Scenario: validateShopFolder delegates to FolderRepository

- **WHEN** validateShopFolder(folderId) executes
- **THEN** it calls folderRepository.readMetadata(folderId)
- **AND** calls folderRepository.getFolderName(folderId)
- **AND** does not call driveFetch or readMetadata from drive/metadata directly

### Requirement: Wizard "Open existing" supports dev mode

The system SHALL update the wizard "Open existing" step so that when running in dev mode, the user selects a fixture folder by name via a text input instead of using the Google Picker or pasting a Drive folder ID. The same validateAndSetShop flow is used; folderId in dev mode is the fixture folder name.

#### Scenario: Dev mode shows fixture folder name input

- **WHEN** the wizard "Open existing" step renders in dev mode
- **THEN** the Google Picker and Drive folder ID input are hidden
- **AND** a text input for fixture folder name is shown
- **AND** user can enter a folder name (e.g. `happy-path`, `missingcolumn`)

#### Scenario: validateAndSetShop works with folder name in dev mode

- **WHEN** user submits the fixture folder name in dev mode
- **THEN** validateAndSetShop(folderName) is called with the folder name as folderId
- **AND** CsvFolderRepository reads metadata from that folder
- **AND** shop store is populated on success

## Google Sheets connection and reads

### Requirement: Spreadsheet is created on first use

The system SHALL create a Google Spreadsheet named `illo3d-data` when the user creates a new shop via the setup wizard. The spreadsheet SHALL contain empty sheets with headers for: clients, jobs, pieces, piece_items, inventory, expenses, transactions. The spreadsheet SHALL be moved into the shop's Drive folder after creation.

#### Scenario: New shop creates spreadsheet in folder

- **WHEN** the user creates a new shop via the wizard
- **THEN** system creates the spreadsheet with all required sheets and headers
- **AND** moves the spreadsheet into the shop's Drive folder

#### Scenario: Existing shop connects to its spreadsheet

- **WHEN** the user opens an existing shop via the wizard
- **THEN** system connects to the spreadsheet ID from the shop's metadata file

### Requirement: Spreadsheet ID is persisted

The system SHALL read the spreadsheet ID from the active shop in the shop store (persisted in `sessionStorage`). The spreadsheet ID originates from the `illo3d.metadata.json` file in the shop's folder. The system SHALL NOT use `localStorage` for spreadsheet ID storage.

#### Scenario: Spreadsheet ID comes from shop store

- **WHEN** the app needs the spreadsheet ID
- **THEN** it reads from `shopStore.activeShop.spreadsheetId`

#### Scenario: Reconnection uses shop store

- **WHEN** user returns to app in the same browser session
- **AND** active shop exists in sessionStorage
- **THEN** system connects directly using the shop's spreadsheet ID

### Requirement: Sheet structure is validated on connect

The system SHALL validate that the connected spreadsheet has the expected sheets and headers. If headers are missing or incorrect, the system SHALL display an error message.

#### Scenario: Valid structure passes validation

- **WHEN** system connects to spreadsheet
- **AND** all sheets exist with correct headers
- **THEN** connection succeeds and app loads normally

#### Scenario: Invalid structure shows error

- **WHEN** system connects to spreadsheet
- **AND** sheets or headers are missing/incorrect
- **THEN** system displays error message with details of what's wrong

### Requirement: OAuth credentials are reused from auth

The system SHALL use the Google OAuth credentials from the existing auth system (authStore) to authenticate with Google Sheets API when using the Google Drive backend. No additional login SHALL be required.

#### Scenario: Sheets API uses existing credentials

- **WHEN** user is authenticated via Google OAuth
- **AND** user accesses Sheets functionality on Google Drive backend
- **THEN** system uses the stored credential token for Sheets API calls

#### Scenario: Unauthenticated user cannot access Sheets

- **WHEN** user is not authenticated
- **THEN** Sheets functionality is not available

### Requirement: Read operations fetch data from sheets

The system SHALL provide functions to read all rows from any sheet, returning typed data objects. Read operations SHALL use TanStack Query for caching.

#### Scenario: Read all transactions

- **WHEN** app requests transactions data
- **THEN** system fetches all rows from transactions sheet
- **AND** returns array of Transaction objects

#### Scenario: Cached data is returned on subsequent reads

- **WHEN** app requests same data within cache TTL
- **THEN** cached data is returned without API call

### Requirement: Connection status is visible

The system SHALL display connection status in the UI. Status includes: connecting, connected, error.

#### Scenario: Connection status shown while connecting

- **WHEN** app is establishing connection to spreadsheet
- **THEN** UI shows "Connecting..." or loading indicator

#### Scenario: Connected status shown on success

- **WHEN** connection is established successfully
- **THEN** UI shows connected status (can be subtle/hidden when connected)

#### Scenario: Error status shown on failure

- **WHEN** connection fails
- **THEN** UI shows error message with retry option

## Sheets repository

### Requirement: SheetsRepository interface defines data access contract

The system SHALL provide a `SheetsRepository` interface (or equivalent abstraction) that defines methods for: reading rows by sheet name, getting sheet names, getting header row by sheet name, and creating a spreadsheet. All Sheets data access SHALL flow through this interface.

#### Scenario: Interface covers read operations

- **WHEN** the system needs to read rows from a sheet
- **THEN** it calls `readRows(spreadsheetId, sheetName)` on the repository
- **AND** receives an array of typed objects

#### Scenario: Interface covers structure validation data

- **WHEN** the system needs to validate spreadsheet structure
- **THEN** it calls `getSheetNames(spreadsheetId)` and `getHeaderRow(spreadsheetId, sheetName)` on the repository
- **AND** uses the results to verify expected sheets and headers exist

#### Scenario: Interface covers spreadsheet creation

- **WHEN** the setup wizard creates a new shop
- **THEN** it calls `createSpreadsheet()` on the repository
- **AND** receives a spreadsheet ID for subsequent operations

### Requirement: GoogleSheetsRepository implements production backend

The system SHALL provide a `GoogleSheetsRepository` implementation that performs all operations via the Google Sheets API using existing OAuth credentials. This implementation SHALL be used when backend is `google-drive`.

#### Scenario: Google Drive backend uses Google Sheets repository

- **WHEN** the app uses backend `google-drive`
- **THEN** SheetsRepository is GoogleSheetsRepository
- **AND** all data operations hit the real Google Sheets API

### Requirement: Repository selection is backend-driven

The system SHALL select the SheetsRepository implementation based on the user's backend choice (from backendStore), not on `import.meta.env.DEV`. When backend is `local-csv` with a FileSystemDirectoryHandle, use LocalSheetsRepository. When backend is `local-csv` with fixture folder (dev), use CsvSheetsRepository. When backend is `google-drive`, use GoogleSheetsRepository.

#### Scenario: Backend store selects LocalSheetsRepository

- **WHEN** the backend store has `backend: 'local-csv'` and a FileSystemDirectoryHandle is set
- **THEN** getSheetsRepository returns LocalSheetsRepository
- **AND** all operations read/write CSV files via the File System Access API

#### Scenario: Backend store selects CsvSheetsRepository (fixtures)

- **WHEN** the backend store has `backend: 'local-csv'` and the shop uses a fixture folder
- **THEN** getSheetsRepository returns CsvSheetsRepository
- **AND** read operations fetch from `/fixtures/<folder-name>/`

#### Scenario: Backend store selects GoogleSheetsRepository

- **WHEN** the backend store has `backend: 'google-drive'`
- **THEN** getSheetsRepository returns GoogleSheetsRepository
- **AND** all operations hit the Google Sheets API

### Requirement: CsvSheetsRepository implements dev backend

The system SHALL provide a `CsvSheetsRepository` implementation that reads from a fixtures folder of CSV files (one file per sheet). This implementation SHALL be used when backend is `local-csv` with fixture folder. The same implementation SHALL serve both dev mode and automated tests.

#### Scenario: CSV files match sheet structure

- **WHEN** CsvSheetsRepository reads a sheet
- **THEN** it reads the corresponding CSV file from the selected fixture folder (e.g. `transactions.csv` for transactions sheet)
- **AND** parses headers from the first row and data from subsequent rows
- **AND** returns objects keyed by header names

#### Scenario: Fixture folder is selected via wizard

- **WHEN** CsvSheetsRepository is used
- **THEN** the folder name comes from the shop store (user entered it in the wizard "Open existing" step)
- **AND** reads from `/fixtures/<folder-name>/<sheetName>.csv`
- **AND** multiple fixture folders may exist (e.g. `happy-path`, `missingcolumn`, `empty`)

#### Scenario: Fixtures folder is read-only

- **WHEN** CsvSheetsRepository is used
- **THEN** the fixture CSV files are not mutated
- **AND** `createSpreadsheet()` is a no-op or returns a sentinel ID

### Requirement: LocalSheetsRepository implements SheetsRepository via File System Access API

The system SHALL provide a `LocalSheetsRepository` that implements SheetsRepository using a `FileSystemDirectoryHandle`. It SHALL read and write CSV files (one per sheet) in the directory. `createSpreadsheet` SHALL create the metadata file and CSV files with headers for all sheets. This implementation SHALL be used when the user creates or opens a Local CSV shop via the directory picker.

#### Scenario: LocalSheetsRepository reads rows from CSV files

- **WHEN** LocalSheetsRepository.readRows is called with a sheet name
- **THEN** it reads the corresponding CSV file from the directory
- **AND** parses headers from the first row and returns objects keyed by header names

#### Scenario: LocalSheetsRepository creates new shop

- **WHEN** LocalSheetsRepository.createSpreadsheet is called
- **THEN** it creates `illo3d.metadata.json` and CSV files for all sheets (with header rows)
- **AND** returns an identifier for the shop (e.g. directory handle reference)

#### Scenario: LocalSheetsRepository appends rows

- **WHEN** LocalSheetsRepository.appendRows is called
- **THEN** it appends rows to the corresponding CSV file in the directory

### Requirement: Domain logic uses repository without backend awareness

The system SHALL refactor fetchers (e.g. `fetchTransactions`, `fetchClients`), `validateStructure`, `connect`, and `createSpreadsheet` to call the repository interface. These modules SHALL NOT call `sheetsFetch` or `readSheetRows` directly. The repository SHALL be the single point of backend access.

#### Scenario: Fetchers use repository

- **WHEN** `fetchTransactions` or `fetchClients` executes
- **THEN** it calls the repository's `readRows` method
- **AND** applies domain logic (filtering, parsing, sorting) to the result
- **AND** does not reference Google API or CSV implementation

#### Scenario: validateStructure uses repository

- **WHEN** `validateStructure` executes
- **THEN** it calls the repository's `getSheetNames` and `getHeaderRow`
- **AND** compares against expected structure from config
- **AND** does not call sheetsFetch directly

### Requirement: Fixture folders mirror Drive structure

The system SHALL include `public/fixtures/<folder-name>/` directories where folder-name is a descriptive scenario (e.g. `missingcolumn`, `happy-path`, `empty`). Each folder SHALL contain: one CSV per sheet (`transactions.csv`, `clients.csv`, etc.) with headers matching `SHEET_HEADERS`, plus `illo3d.metadata.json`—an exact copy of what Drive would have (app, version, spreadsheetId, createdAt, createdBy). Multiple fixture folders MAY exist. Files SHALL be committed to the repository.

#### Scenario: Fixture folder has proper structure

- **WHEN** a fixture folder is used (e.g. `happy-path`)
- **THEN** it contains `illo3d.metadata.json` with app, version, spreadsheetId, createdAt, createdBy
- **AND** contains CSV files for sheets (e.g. `transactions.csv`, `clients.csv`) with header row matching config
- **AND** structure mirrors what Drive would have for a real shop folder

#### Scenario: Multiple fixture folders exist

- **WHEN** the app runs with CSV backend
- **THEN** the user selects which folder to load by typing its name in the wizard "Open existing" step
- **AND** CsvSheetsRepository reads from `/fixtures/<folder-name>/` for that folder only
- **AND** different scenarios (missingcolumn, happy-path, empty) are separate folders

## Sheet writes (append)

### Requirement: SheetsRepository interface includes appendRows

The system SHALL extend the SheetsRepository interface with an `appendRows(spreadsheetId, sheetName, rows)` method. The method SHALL accept an array of row objects (keyed by header names) and append them to the specified sheet. Both GoogleSheetsRepository and CsvSheetsRepository SHALL implement this method.

#### Scenario: Interface defines appendRows

- **WHEN** the system needs to append rows to a sheet
- **THEN** it calls `appendRows(spreadsheetId, sheetName, rows)` on the repository
- **AND** rows are objects with keys matching SHEET_HEADERS for that sheet

#### Scenario: GoogleSheetsRepository appends via API

- **WHEN** appendRows is called on GoogleSheetsRepository
- **THEN** it uses the Google Sheets API values.append endpoint
- **AND** rows are written to the specified sheet

### Requirement: CsvSheetsRepository writes via dev server API in dev

The system SHALL provide a mechanism for CsvSheetsRepository to write rows when running in dev mode. Because the browser cannot write to the filesystem, a Vite plugin SHALL expose an API endpoint (e.g. POST /api/sheets/append) that receives append requests and writes to the fixture CSV files on disk. CsvSheetsRepository.appendRows SHALL call this endpoint when in dev.

#### Scenario: Dev append goes through API

- **WHEN** appendRows is called on CsvSheetsRepository in dev mode
- **THEN** it sends a request to the dev server API with spreadsheetId, sheetName, rows
- **AND** the API writes the rows to the appropriate fixture CSV file

#### Scenario: Production does not use CSV write

- **WHEN** the app runs in production
- **THEN** CsvSheetsRepository is not used (GoogleSheetsRepository is used)
- **AND** no dev server API exists in the production build

### Requirement: Tests that write use temporary fixture copy

The system SHALL support tests that call appendRows without mutating committed fixture files. Before a test that writes, the test setup SHALL copy the fixture folder to a temporary directory (e.g. /tmp/illo3d-fixture-xxx). The repository SHALL be configured to use that copy. After the test, the setup SHALL remove the temporary copy.

#### Scenario: Write test uses temp copy

- **WHEN** a test needs to call appendRows
- **THEN** setup copies the fixture folder to /tmp
- **AND** the test runs against the copy
- **AND** teardown removes the copy
- **AND** the original fixture folder is unchanged

## Local CSV via File System Access API

### Requirement: File System Access API creates new Local CSV shop

The system SHALL use the File System Access API (`showDirectoryPicker`) to let the user select or create a folder. When creating a new Local CSV shop, the system SHALL write `illo3d.metadata.json` and CSV files (transactions, expenses, clients, etc.) to that folder. Chrome support is required; other browsers MAY show an unsupported message.

#### Scenario: User creates new Local CSV shop

- **WHEN** the user selects Local CSV and clicks "Create new shop"
- **AND** the browser supports File System Access API
- **THEN** the system opens the directory picker
- **AND** after the user selects a folder, creates metadata and CSV files there
- **AND** sets the shop as active

#### Scenario: User cancels directory picker

- **WHEN** the user cancels the directory picker without selecting a folder
- **THEN** the wizard returns to step 1

#### Scenario: Unsupported browser for Local CSV create

- **WHEN** the user selects Local CSV and clicks "Create new shop"
- **AND** the browser does not support File System Access API
- **THEN** the system shows an error or fallback message indicating Chrome is required

### Requirement: File System Access API opens existing Local CSV shop

The system SHALL use the File System Access API to let the user select an existing folder containing a valid illo3d shop (metadata + CSVs). The system SHALL validate the folder and set the shop as active on success.

#### Scenario: User opens existing Local CSV shop

- **WHEN** the user selects Local CSV and clicks "Open existing shop"
- **AND** the browser supports File System Access API
- **THEN** the system opens the directory picker
- **AND** after the user selects a folder, validates metadata and structure
- **AND** on success, sets the shop as active

#### Scenario: Invalid folder for Local CSV open

- **WHEN** the user selects a folder that does not contain valid illo3d metadata
- **THEN** the system shows an error: "This folder is not an illo3d shop"

#### Scenario: Incompatible version for Local CSV open

- **WHEN** the user selects a folder whose metadata major version differs from the app's
- **THEN** the system shows an error indicating version incompatibility

### Requirement: Local CSV backend is Chrome-only

The system SHALL document or enforce that Local CSV create/open via File System Access API requires Chrome. The system MAY degrade gracefully (e.g. show message) on unsupported browsers.

#### Scenario: Chrome supports Local CSV

- **WHEN** the app runs in Chrome
- **THEN** Local CSV create and open via File System Access API are available
