# shop-management Specification

## Purpose

Manage active shop selection and metadata compatibility for the authenticated app session.

## Requirements

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

The system SHALL expose an `APP_VERSION` constant (semver string) in `src/config/version.ts`. This constant SHALL be manually bumped following semver conventions. Any change that modifies the spreadsheet schema or metadata structure SHALL evaluate whether it constitutes a breaking change and propose a major version bump.

#### Scenario: APP_VERSION is accessible
- **WHEN** any module needs the current app version
- **THEN** it imports `APP_VERSION` from `@/config/version`

### Requirement: Version compatibility check uses semver major

The system SHALL compare the major version of the app's `APP_VERSION` with the major version in the metadata file. If the major versions differ, the system SHALL refuse to open the shop and show an error.

#### Scenario: Same major version is compatible
- **WHEN** app version is `1.2.0` and metadata version is `1.0.0`
- **THEN** the shop is considered compatible and can be opened

#### Scenario: Different major version is incompatible
- **WHEN** app version is `2.0.0` and metadata version is `1.5.0`
- **THEN** the shop is considered incompatible and the system shows a version error

#### Scenario: Same major version with higher minor in metadata
- **WHEN** app version is `1.0.0` and metadata version is `1.3.0`
- **THEN** the shop is considered compatible (same major)
