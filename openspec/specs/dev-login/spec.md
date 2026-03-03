# dev-login Specification

## Purpose

Provide a non-interactive authentication mechanism for local development and automated testing using a Google Service Account, bypassing interactive Google OAuth and the setup wizard by automatically connecting to a pre-configured Drive folder with fixtures.

## Requirements

### Requirement: Dev login button is visible only in development mode

The system SHALL display a "Dev Login" button on the login page only when `import.meta.env.DEV` is `true`. The button SHALL NOT be rendered in production builds.

#### Scenario: Dev login button visible in development
- **WHEN** the login page renders in development mode (`import.meta.env.DEV === true`)
- **THEN** a "Dev Login" button is visible alongside the regular Google sign-in button

#### Scenario: Dev login button hidden in production
- **WHEN** the login page renders in production mode (`import.meta.env.DEV === false`)
- **THEN** no "Dev Login" button is rendered in the DOM

### Requirement: Dev login exchanges Service Account credentials for an access token

The system SHALL sign a JWT using the Service Account's private key and email (loaded from a JSON credentials file via `VITE_SA_CREDENTIALS_FILE`), then exchange it with Google's OAuth2 token endpoint for an access token. The JWT SHALL request `spreadsheets` and `drive` scopes.

#### Scenario: Successful token exchange
- **WHEN** the user clicks "Dev Login" and SA credentials are configured
- **THEN** the system signs a JWT with RS256, POSTs it to the Google token endpoint, and receives an access token

#### Scenario: Missing SA credentials
- **WHEN** the user clicks "Dev Login" and `VITE_SA_CREDENTIALS_FILE` is not set or the file is missing
- **THEN** the system displays an error message indicating missing configuration

#### Scenario: Token exchange failure
- **WHEN** the SA token exchange request fails (network error, invalid credentials)
- **THEN** the system displays an error message and allows retrying

### Requirement: Dev login injects auth state and sets active shop automatically

The system SHALL inject the obtained access token and a hardcoded dev user into `authStore`, then immediately validate and set the active shop from a hardcoded folder ID (`VITE_SA_FOLDER_ID`), bypassing the setup wizard entirely.

#### Scenario: Auth store and shop store populated after dev login
- **WHEN** the SA token exchange succeeds and `VITE_SA_FOLDER_ID` is configured
- **THEN** `authStore` contains the SA token and dev user, and `shopStore` contains the active shop from the hardcoded folder

#### Scenario: Navigation after dev login skips wizard
- **WHEN** the dev login completes successfully
- **THEN** the user is redirected directly to `/transactions` (or the return path), never seeing the setup wizard

#### Scenario: Missing folder ID
- **WHEN** the SA token exchange succeeds but `VITE_SA_FOLDER_ID` is not set
- **THEN** the system injects auth state only and lets the user proceed through the wizard normally

### Requirement: Dev login folder contains pre-created fixtures

The hardcoded folder (`VITE_SA_FOLDER_ID`) SHALL contain a valid `illo3d.metadata.json` file and a spreadsheet with the expected sheet structure, shared with the Service Account email as Editor. These fixtures are created manually once and reused across all dev/e2e sessions.

#### Scenario: Folder fixtures are valid
- **WHEN** dev login validates the hardcoded folder
- **THEN** the metadata version matches the app's major version and the spreadsheet structure is valid

### Requirement: SA credentials and folder ID are read from environment

The system SHALL read SA credentials from a JSON file pointed to by `VITE_SA_CREDENTIALS_FILE` and the folder ID from `VITE_SA_FOLDER_ID`. Both SHALL be documented in `.env.example` as optional and dev-only.

#### Scenario: Environment variables documented
- **WHEN** a developer sets up the project
- **THEN** `.env.example` lists `VITE_SA_CREDENTIALS_FILE` and `VITE_SA_FOLDER_ID` with comments indicating they are optional and dev-only

### Requirement: Dev login shows loading state during token exchange and folder validation

The system SHALL display a loading indicator on the Dev Login button while the token exchange and folder validation are in progress. The button SHALL be disabled during this time.

#### Scenario: Loading state during dev login
- **WHEN** the user clicks "Dev Login" and the process is in progress
- **THEN** the button shows a loading state and is not clickable

### Requirement: Dev login UI strings support i18n

All user-facing text related to dev login (button label, error messages, loading text) SHALL use i18next translation keys.

#### Scenario: Dev login text is translatable
- **WHEN** the dev login button or any related message renders
- **THEN** all visible text is sourced from i18n keys
