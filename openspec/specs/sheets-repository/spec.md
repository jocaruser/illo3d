# sheets-repository Specification

## Purpose

Abstraction layer for Sheets data access. Enables swappable backends: Google Sheets (production) and CSV (dev/test) so developers and automated tests run without real Google API credentials.

## Requirements

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

The system SHALL provide a `GoogleSheetsRepository` implementation that performs all operations via the Google Sheets API using existing OAuth credentials. This implementation SHALL be used in production.

#### Scenario: Production uses Google backend
- **WHEN** the app runs in production mode
- **THEN** SheetsRepository is GoogleSheetsRepository
- **AND** all data operations hit the real Google Sheets API

### Requirement: CsvSheetsRepository implements dev backend

The system SHALL provide a `CsvSheetsRepository` implementation that reads from a fixtures folder of CSV files (one file per sheet). This implementation SHALL be used when `import.meta.env.DEV` is true. The same implementation SHALL serve both dev mode and automated tests.

#### Scenario: Dev uses CSV backend
- **WHEN** the app runs in dev mode
- **THEN** SheetsRepository is CsvSheetsRepository
- **AND** read operations fetch from fixture CSV files

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

### Requirement: Repository selection is environment-driven

The system SHALL select the repository implementation at module load based on environment: CSV when `import.meta.env.DEV` is true, otherwise Google. Selection SHALL occur in a single bootstrap module.

#### Scenario: Environment selects CSV in dev
- **WHEN** `import.meta.env.DEV` is true
- **THEN** the bootstrap module exports CsvSheetsRepository as the active implementation

#### Scenario: Environment selects Google in production
- **WHEN** `import.meta.env.DEV` is false
- **THEN** the bootstrap module exports GoogleSheetsRepository as the active implementation

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
