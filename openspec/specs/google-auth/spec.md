# google-auth Specification

## Purpose

Google One Tap sign-in, OAuth/OIDC integration, and login/logout status UI. Enables future Gsheet connection by storing credentials and exposing auth state.

## ADDED Requirements

### Requirement: Google One Tap sign-in is available

The system SHALL integrate Google Identity Services (GIS) to offer One Tap sign-in when the user is not authenticated. One Tap SHALL appear automatically when supported by the browser and user has not dismissed it.

#### Scenario: One Tap prompt appears for unauthenticated user
- **WHEN** user loads the app and is not signed in
- **THEN** Google One Tap prompt MAY appear (subject to browser/cookie support)

#### Scenario: One Tap completes sign-in
- **WHEN** user selects their Google account in the One Tap prompt
- **THEN** system stores credentials and updates auth state to signed in

### Requirement: Fallback sign-in button when One Tap unavailable

The system SHALL display a "Sign in with Google" button when One Tap is unavailable (blocked, dismissed, or failed to load). Clicking the button SHALL trigger the standard Google OAuth flow.

#### Scenario: Fallback button visible when not signed in
- **WHEN** user is not authenticated and One Tap does not show or is dismissed
- **THEN** user sees a "Sign in with Google" button (or i18n equivalent)

#### Scenario: Fallback button triggers OAuth
- **WHEN** user clicks "Sign in with Google"
- **THEN** Google OAuth flow opens and on success credentials are stored

### Requirement: All OAuth scopes requested at login

The system SHALL request all required OAuth scopes (`spreadsheets` and `drive.file`) during the initial login flow. The user SHALL see a single consent screen at login time. No additional consent prompts SHALL appear when using API features later.

#### Scenario: Login requests all scopes upfront
- **WHEN** the user clicks "Sign in with Google" on the login page
- **THEN** the OAuth consent includes both `spreadsheets` and `drive.file` scopes in a single request

#### Scenario: No additional consent prompts for API features
- **WHEN** the user uses Drive or Sheets features after login
- **THEN** the system uses the stored access token without showing additional consent prompts

### Requirement: Access token stored alongside user credentials

The system SHALL store the OAuth access token in the auth store (persisted to sessionStorage) after successful login. The token SHALL be available for all API calls without re-requesting authorization.

#### Scenario: Access token available after login
- **WHEN** the user completes Google sign-in
- **THEN** the auth store contains both user info and a valid access token

#### Scenario: Stored access token used for API calls
- **WHEN** an API call requires authorization
- **THEN** the system uses the access token from the auth store

### Requirement: Login/logout status is visible

The system SHALL display auth status in the main layout. When signed in: show user identity (e.g. name or email) and a sign-out action. When signed out: the header SHALL NOT display any sign-in UI — sign-in is handled exclusively by the login page.

#### Scenario: Signed-in status display
- **WHEN** user is authenticated
- **THEN** UI shows signed-in state (e.g. "Signed in as <name>" or email) and a sign-out control

#### Scenario: Signed-out status display
- **WHEN** user is not authenticated
- **THEN** the header does not render sign-in options (user is redirected to login page by route guard)

#### Scenario: Sign-out clears session
- **WHEN** user triggers sign-out
- **THEN** credentials are cleared, active shop is cleared, auth state updates to signed out, and the route guard redirects to `/login`

### Requirement: Credentials are stored for API use

The system SHALL store the ID token and/or access token from Google in memory (Zustand). Optionally SHALL persist to sessionStorage so credentials survive page refresh within the same tab.

#### Scenario: Credentials available after sign-in
- **WHEN** user completes Google sign-in
- **THEN** auth store contains credentials usable for API calls (e.g. Gsheet)

#### Scenario: Credentials cleared on sign-out
- **WHEN** user signs out
- **THEN** stored credentials are removed

### Requirement: OAuth client ID is configurable via environment

The system SHALL read the Google OAuth client ID from `VITE_GOOGLE_CLIENT_ID`. The app SHALL not hardcode client IDs or secrets.

#### Scenario: Client ID from env
- **WHEN** app initializes Google OAuth
- **THEN** it uses `import.meta.env.VITE_GOOGLE_CLIENT_ID`

### Requirement: Google API key is configurable via environment

The system SHALL read a Google API key from `VITE_GOOGLE_API_KEY` for use with the Google Picker API. The app SHALL NOT hardcode API keys.

#### Scenario: API key available from environment
- **WHEN** the app needs the Google API key (e.g., for Picker)
- **THEN** it reads from `import.meta.env.VITE_GOOGLE_API_KEY`

### Requirement: Auth UI strings support i18n

All user-facing auth strings (sign-in button, signed-in message, sign-out) SHALL use i18next so they can be translated.

#### Scenario: Auth strings are translatable
- **WHEN** app renders auth UI
- **THEN** text comes from i18n keys (e.g. `auth.signIn`, `auth.signedInAs`, `auth.signOut`)
