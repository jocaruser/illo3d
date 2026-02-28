# gsheet-backend Specification

## Purpose

Conexión con Google Sheets como base de datos. Crear spreadsheet con hojas para cada entidad, operaciones de lectura via Google Sheets API.

## ADDED Requirements

### Requirement: Spreadsheet is created on first use

The system SHALL create a Google Spreadsheet named `illo3d-data` when the user first accesses the app and no spreadsheet exists. The spreadsheet SHALL contain empty sheets with headers for: clients, jobs, pieces, piece_items, inventory, expenses, transactions.

#### Scenario: First time user creates spreadsheet
- **WHEN** authenticated user accesses the app for the first time
- **AND** no `illo3d-data` spreadsheet exists in their Drive
- **THEN** system creates the spreadsheet with all required sheets and headers

#### Scenario: Existing spreadsheet is reused
- **WHEN** authenticated user accesses the app
- **AND** `illo3d-data` spreadsheet already exists
- **THEN** system connects to the existing spreadsheet without creating a new one

### Requirement: Spreadsheet ID is persisted

The system SHALL store the spreadsheet ID in localStorage after creation or first connection. Subsequent sessions SHALL use this ID to reconnect without searching Drive.

#### Scenario: Spreadsheet ID saved after creation
- **WHEN** system creates a new spreadsheet
- **THEN** spreadsheet ID is saved to localStorage

#### Scenario: Reconnection uses stored ID
- **WHEN** user returns to app in a new session
- **AND** spreadsheet ID exists in localStorage
- **THEN** system connects directly using the stored ID

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

The system SHALL use the Google OAuth credentials from the existing auth system (authStore) to authenticate with Google Sheets API. No additional login SHALL be required.

#### Scenario: Sheets API uses existing credentials
- **WHEN** user is authenticated via Google OAuth
- **AND** user accesses Sheets functionality
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
