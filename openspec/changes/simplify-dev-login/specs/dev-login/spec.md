## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Dev login exchanges Service Account credentials for an access token
**Reason**: SA token exchange is no longer needed. Dev Login injects fixture data directly without any external API calls.
**Migration**: Dev Login now works with zero configuration — no SA credentials file, no env vars.

### Requirement: Dev login injects auth state and sets active shop automatically
**Reason**: Replaced by "Dev login injects fixture auth and shop state" which covers both auth and shop injection without depending on SA tokens or folder validation.
**Migration**: The new requirement handles the same behavior with hardcoded fixtures instead of SA-derived tokens and validated folders.

### Requirement: Dev login folder contains pre-created fixtures
**Reason**: No real Google Drive folder is accessed during dev login. Fixture data is hardcoded in the application code.
**Migration**: Remove any manually-created Drive folders used for dev login. E2E tests use Playwright API mocking instead.

### Requirement: SA credentials and folder ID are read from environment
**Reason**: All SA-related env vars are removed. Dev Login requires zero configuration.
**Migration**: Remove `VITE_SA_CREDENTIALS_FILE`, `VITE_SA_FOLDER_ID`, `VITE_SA_CLIENT_EMAIL`, `VITE_SA_PRIVATE_KEY` from `.env` files.

### Requirement: Dev login shows loading state during token exchange and folder validation
**Reason**: Dev Login is now synchronous — no token exchange or folder validation occurs. A loading state is unnecessary.
**Migration**: Remove loading state UI. The button click results in immediate navigation.
