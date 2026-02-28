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

### Requirement: Login/logout status is visible

The system SHALL display auth status in the main layout. When signed in: show user identity (e.g. name or email) and a sign-out action. When signed out: show sign-in option.

#### Scenario: Signed-in status display
- **WHEN** user is authenticated
- **THEN** UI shows signed-in state (e.g. "Signed in as &lt;name&gt;" or email) and a sign-out control

#### Scenario: Signed-out status display
- **WHEN** user is not authenticated
- **THEN** UI shows sign-in option (One Tap area or fallback button)

#### Scenario: Sign-out clears session
- **WHEN** user triggers sign-out
- **THEN** credentials are cleared and auth state updates to signed out

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

### Requirement: Auth UI strings support i18n

All user-facing auth strings (sign-in button, signed-in message, sign-out) SHALL use i18next so they can be translated.

#### Scenario: Auth strings are translatable
- **WHEN** app renders auth UI
- **THEN** text comes from i18n keys (e.g. `auth.signIn`, `auth.signedInAs`, `auth.signOut`)
