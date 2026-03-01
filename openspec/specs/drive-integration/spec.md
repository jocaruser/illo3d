# drive-integration Specification

## Purpose

Integrate Google Drive and Picker APIs for shop folder, metadata, and spreadsheet location workflows.

## Requirements

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
