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
