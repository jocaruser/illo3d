# folder-repository Specification

## Purpose

Abstraction layer for shop folder metadata access. Enables the wizard "Open existing" flow in CSV mode by swapping between Google Drive (production) and CSV fixture folders (dev/test). Create folder remains out of scope.

## Requirements

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

### Requirement: GoogleFolderRepository implements production backend

The system SHALL provide a `GoogleFolderRepository` that uses the Google Drive API for `readMetadata` and `getFolderName`. This implementation SHALL be used in production.

#### Scenario: Production uses Drive for folder metadata
- **WHEN** the app runs in production mode
- **THEN** FolderRepository is GoogleFolderRepository
- **AND** readMetadata and getFolderName hit the real Google Drive API

### Requirement: CsvFolderRepository implements dev backend

The system SHALL provide a `CsvFolderRepository` that fetches metadata from `/fixtures/<folderId>/illo3d.metadata.json` and returns the folderId as the folder name. In dev mode, folderId IS the fixture folder name (e.g. `happy-path`).

#### Scenario: Dev mode uses fixture folder for metadata
- **WHEN** the app runs in dev mode and user selects folder "happy-path" in the wizard
- **THEN** CsvFolderRepository fetches `/fixtures/happy-path/illo3d.metadata.json`
- **AND** returns the metadata (spreadsheetId, etc.) for shop validation

#### Scenario: getFolderName in dev mode
- **WHEN** getFolderName is called with folderId "happy-path"
- **THEN** CsvFolderRepository returns "happy-path" (or a display-friendly name)

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
