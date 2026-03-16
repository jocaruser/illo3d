# local-csv-backend Specification

## Purpose

Support Local CSV as a first-class backend for creating and opening shops via the File System Access API. Enables development and testing without Google credentials. Chrome support is required.

## Requirements

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
