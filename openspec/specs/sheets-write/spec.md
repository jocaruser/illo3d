# sheets-write Specification

## Purpose

Abstract write capability for the Sheets repository. Enables appending rows to sheets in both Google Sheets (production) and CSV (dev) backends. Dev uses a Vite plugin API to write to fixture CSVs. Tests that write use a /tmp copy of fixtures and restore after each test.

## Requirements

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
