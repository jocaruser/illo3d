# dev-login Specification

## Purpose

Provide a non-interactive authentication mechanism for local development and automated testing by injecting hardcoded fixture data (user, credentials, shop) directly into the app state, bypassing interactive Google OAuth and the setup wizard with zero configuration.

## Requirements

### Requirement: Dev login button is visible only in development mode

The system SHALL display a "Dev Login" button on the login page only when `import.meta.env.DEV` is `true`. The button SHALL NOT be rendered in production builds.

#### Scenario: Dev login button visible in development
- **WHEN** the login page renders in development mode (`import.meta.env.DEV === true`)
- **THEN** a "Dev Login" button is visible alongside the regular Google sign-in button

#### Scenario: Dev login button hidden in production
- **WHEN** the login page renders in production mode (`import.meta.env.DEV === false`)
- **THEN** no "Dev Login" button is rendered in the DOM

### Requirement: Dev login injects fixture auth and shop state

The system SHALL inject a hardcoded fake access token, a fixture dev user, and a fixture active shop directly into `authStore` and `shopStore` when the user clicks "Dev Login". No external API calls SHALL be made. The operation SHALL be synchronous.

#### Scenario: Auth and shop stores populated after dev login
- **WHEN** the user clicks "Dev Login"
- **THEN** `authStore` contains a fixture dev user and fake access token, and `shopStore` contains a fixture active shop with hardcoded folderId, folderName, spreadsheetId, and metadataVersion

#### Scenario: Navigation after dev login skips wizard
- **WHEN** the dev login completes
- **THEN** the user is redirected directly to the return path (or `/`), never seeing the setup wizard

#### Scenario: No network calls during dev login
- **WHEN** the user clicks "Dev Login"
- **THEN** no HTTP requests are made to any external service

### Requirement: Dev login UI strings support i18n

All user-facing text related to dev login (button label) SHALL use i18next translation keys.

#### Scenario: Dev login text is translatable
- **WHEN** the dev login button renders
- **THEN** all visible text is sourced from i18n keys
