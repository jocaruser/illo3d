# authentication Specification

## Purpose

End-to-end authentication for illo3d: Google Identity Services (One Tap and OAuth where applicable), credentials and session storage, the setup wizard as the primary entry point (including synthetic identity for local files), and route protection with return-path preservation. Automated tests mock OAuth and directory APIs at the Playwright boundary; there is no dev-only login UI.

## Google OAuth and API configuration

### Requirement: Google One Tap sign-in is available

The system SHALL integrate Google Identity Services (GIS) to offer One Tap sign-in when the user is not authenticated. One Tap SHALL appear automatically when supported by the browser and user has not dismissed it.

#### Scenario: One Tap prompt appears for unauthenticated user

- **WHEN** user is on the setup wizard welcome screen, has expressed intent to use Google Drive, and is not signed in
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

### Requirement: One Tap path yields Drive-capable OAuth access before Drive UI

When the user completes Google One Tap on the path toward the Google Drive backend, the system SHALL obtain and store an OAuth 2.0 access token that satisfies the same Drive and Sheets authorization needs as the standard Google sign-in flow (including `https://www.googleapis.com/auth/drive.file` and spreadsheet scopes the app uses) in the auth store before the UI presents Google Drive folder open, create, or paste-id actions.

#### Scenario: Token ready before folder actions

- **WHEN** the user successfully completes One Tap while proceeding with Google Drive
- **THEN** the auth store contains a valid access token for the app’s Drive and Sheets usage before folder selection or creation is offered

#### Scenario: User declines scope grant after One Tap

- **WHEN** the user completes One Tap but does not complete the OAuth scope grant required for Drive
- **THEN** the system does not treat the Google Drive backend as fully authorized for folder operations until the user completes that grant or uses the fallback OAuth sign-in successfully

### Requirement: One Tap is initialized from the wizard welcome path for Google Drive

The system SHALL initialize Google One Tap only in contexts where an unauthenticated user is choosing or using the Google Drive backend entry on the setup wizard welcome flow, so that One Tap does not run on unrelated entry paths (e.g. local CSV selection).

#### Scenario: Local CSV path does not trigger One Tap

- **WHEN** the user chooses the local files option on the welcome screen
- **THEN** the system does not show Google One Tap solely on account of that choice

#### Scenario: Google Drive intent enables One Tap

- **WHEN** the user is on the welcome screen and selects or is proceeding with Google Drive as the backend
- **THEN** the system MAY initialize One Tap subject to browser and GIS support

### Requirement: OAuth scope requested at login

The system SHALL request the OAuth scope `https://www.googleapis.com/auth/drive.file` during the initial Google sign-in used for the Drive backend. That scope SHALL be sufficient for Google Drive and Google Sheets API usage on files the user connects through the app. The user SHALL see a single consent screen at login time. No additional consent prompts SHALL appear when using API features later, including automatic silent access-token renewal for the same granted scopes when Google permits it without a new consent UI.

#### Scenario: Login requests drive.file scope upfront

- **WHEN** the user starts Google sign-in for the Drive backend (e.g. by choosing "Google Drive" on the setup wizard welcome screen)
- **THEN** the OAuth consent includes `https://www.googleapis.com/auth/drive.file` and the scopes required for Sheets access used by the app (e.g. spreadsheets) in the same flow where the product requires them

#### Scenario: No additional consent prompts for API features

- **WHEN** the user uses Drive or Sheets features after login
- **THEN** the system uses a valid access token without showing additional consent prompts, including after silent renewal when applicable

### Requirement: Access token stored alongside user credentials

The system SHALL store the OAuth access token in the auth store (persisted to sessionStorage) after successful login. The system SHALL store access token expiry metadata when provided by the token response. The token SHALL be available for all API calls: callers SHALL obtain the current token through the access layer that performs renewal when required, so that a valid token is used without the user repeating consent for the same scopes during normal operation.

#### Scenario: Access token available after login

- **WHEN** the user completes Google sign-in
- **THEN** the auth store contains both user info and a valid access token

#### Scenario: Stored access token used for API calls

- **WHEN** an API call requires authorization
- **THEN** the system uses a valid access token for Google APIs (renewing first when required per design)

### Requirement: Google access token expiry is recorded at sign-in

When Google sign-in completes for the Drive backend, the system SHALL persist an absolute expiry time for the access token alongside the token (e.g. derived from `expires_in` seconds). If the token response does not include expiry information, the system SHALL record that expiry is unknown and rely on reactive renewal paths only.

#### Scenario: Successful OAuth includes expiry metadata

- **WHEN** the user completes Google sign-in and the token response includes `expires_in`
- **THEN** the auth store contains the access token and a stored absolute expiry instant consistent with that duration

#### Scenario: Token response without expires_in

- **WHEN** the user completes Google sign-in and no `expires_in` is available
- **THEN** the auth store contains the access token and does not assert a false expiry time
- **AND** reactive renewal on 401 remains available

### Requirement: Google access token is renewed without extra consent when possible

For the `google-drive` backend, the system SHALL renew the access token using Google Identity Services (silent token request with empty prompt) when the current token is near expiry or after a Google API returns 401, without showing a new OAuth consent screen when Google allows silent issuance for the same scopes.

#### Scenario: Proactive renewal updates the auth store

- **WHEN** the stored access token is near expiry and silent renewal succeeds
- **THEN** the auth store is updated with the new access token and updated expiry metadata if provided

#### Scenario: Silent renewal does not add a consent step during normal work

- **WHEN** silent renewal succeeds during Save or Refresh
- **THEN** the user is not shown an OAuth consent screen for that renewal

### Requirement: Google access token renewal is single-flight

The system SHALL ensure at most one in-flight Google access token renewal operation at a time; concurrent callers SHALL await the same renewal outcome.

#### Scenario: Parallel Save and Refresh share one renewal

- **WHEN** two Google API operations detect expiry concurrently
- **THEN** only one silent renewal request runs to completion
- **AND** both operations observe the same post-renewal token

### Requirement: Google session renewal failure is surfaced for recovery

When silent renewal fails or the user must re-authenticate, the system SHALL expose a user-visible state or message (i18n) that distinguishes session/auth failure from generic network errors and SHALL preserve in-memory workbook edits until the user discards them or successfully re-authenticates.

#### Scenario: Renewal failure shows session message

- **WHEN** silent renewal fails after a 401 or near-expiry attempt
- **THEN** the user sees messaging that indicates the Google session must be restored (or i18n equivalent)
- **AND** the dirty state of the workbook is not cleared solely by that failure

#### Scenario: Session strings are translatable

- **WHEN** session renewal failure UI renders
- **THEN** user-visible text uses i18next keys under a dedicated namespace or `auth.*` keys

### Requirement: Credentials are stored for API use

The system SHALL store the ID token and/or access token from Google in memory (Zustand). Optionally SHALL persist to sessionStorage so credentials survive page refresh within the same tab.

#### Scenario: Credentials available after sign-in

- **WHEN** user completes Google sign-in
- **THEN** auth store contains credentials usable for API calls (e.g. Google Sheets)

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

## Session header and sign-out

### Requirement: Login/logout status is visible

The system SHALL display auth status in the main layout. When signed in: show user identity (e.g. name or email) and a sign-out action. When signed in with backend `google-drive` and an active shop with a `folderId`, the displayed user identity in the signed-in message SHALL be a hyperlink that opens that shop’s Google Drive folder in a new browsing context (e.g. `target="_blank"` with `rel="noopener noreferrer"`). When the backend is not `google-drive` or there is no active shop, the identity SHALL be plain text as before. When signed out: the header SHALL NOT display standalone sign-in controls — the wizard welcome screen is the entry point for signing in or choosing local files.

#### Scenario: Signed-in status display

- **WHEN** user is authenticated
- **THEN** UI shows signed-in state (e.g. "Signed in as <name>" or email) and a sign-out control

#### Scenario: Google Drive mode links identity to shop folder

- **WHEN** user is authenticated
- **AND** the active backend is `google-drive`
- **AND** an active shop exists with a `folderId`
- **THEN** the user identity rendered inside the signed-in message is an anchor whose `href` is the Google Drive folder URL for that `folderId`
- **AND** activating the link opens the folder in a new tab without unloading the illo3d app in the current tab

#### Scenario: Local CSV mode keeps plain identity text

- **WHEN** user is authenticated
- **AND** the active backend is `local-csv`
- **THEN** the user identity in the signed-in message is not a Google Drive folder link

#### Scenario: Google Drive without active shop keeps plain identity text

- **WHEN** user is authenticated
- **AND** the active backend is `google-drive`
- **AND** there is no active shop
- **THEN** the user identity in the signed-in message is not a Google Drive folder link

#### Scenario: Signed-out status display

- **WHEN** user is not authenticated
- **THEN** the header does not render sign-in options (the wizard overlay handles onboarding)

#### Scenario: Sign-out clears session

- **WHEN** user triggers sign-out
- **THEN** credentials are cleared, active shop is cleared, backend state is cleared where applicable, auth state updates to signed out, and the user sees the wizard welcome screen (e.g. on `/`) when no active shop remains

### Requirement: Auth UI strings support i18n

All user-facing auth strings (sign-in button, signed-in message, sign-out) SHALL use i18next so they can be translated.

#### Scenario: Auth strings are translatable

- **WHEN** app renders auth UI
- **THEN** text comes from i18n keys (e.g. `auth.signIn`, `auth.signedInAs`, `auth.signOut`)

## Wizard entry and onboarding

### Requirement: Local-files users get a synthetic identity

When the user selects the Local Files backend, the system SHALL set `authStore` to a synthetic user with `name: 'Local user'`, `email: ''`, and `picture: undefined`. `isAuthenticated` SHALL be `true`. No real authentication SHALL occur.

#### Scenario: Local files selection sets synthetic identity

- **WHEN** the user clicks "Local folder" on the wizard welcome screen
- **THEN** `authStore` is populated with `{ name: 'Local user', email: '', picture: undefined }`
- **AND** `isAuthenticated` is `true`

#### Scenario: Header shows "Local user" with no avatar

- **WHEN** a local-files user is in the app
- **THEN** the header shows "Local user" as the identity
- **AND** no avatar image is rendered

### Requirement: Google OAuth triggers from wizard backend selection

The system SHALL trigger the Google OAuth flow when the user clicks "Google Drive" on the wizard welcome screen. The OAuth consent SHALL request all required scopes (profile, `drive.file`, sheets) in a single popup. On success, `authStore` is populated with the Google user profile and access token.

#### Scenario: Clicking Google Drive triggers OAuth

- **WHEN** the user clicks "Google Drive" on the welcome screen
- **THEN** a Google OAuth popup opens requesting profile, `drive.file`, and sheets scopes

#### Scenario: OAuth success populates auth store

- **WHEN** the OAuth popup completes successfully
- **THEN** `authStore` contains the Google user's name, email, picture, and access token
- **AND** `isAuthenticated` is `true`
- **AND** the wizard advances to the Google Drive screen

#### Scenario: OAuth cancellation returns to welcome

- **WHEN** the user closes the OAuth popup without completing
- **THEN** the wizard stays on the welcome screen
- **AND** `isAuthenticated` remains `false`

#### Scenario: OAuth error shows feedback

- **WHEN** the OAuth flow fails (popup blocked, network error, consent denied)
- **THEN** the wizard shows an error message on the welcome screen
- **AND** the user can try again

### Requirement: No standalone `/login` route as the primary entry

The system SHALL NOT use `/login` as the primary entry for the app. The wizard welcome screen serves as the entry point for users without an active shop. Navigating to `/login` SHALL redirect to `/`.

#### Scenario: No /login route as primary entry

- **WHEN** a user navigates to `/login`
- **THEN** the system redirects to `/` which shows the wizard if no active shop, or app content if a shop is active

#### Scenario: Unauthenticated user sees wizard when no shop

- **WHEN** an unauthenticated user navigates to any route without an active shop
- **THEN** the wizard welcome screen appears as an overlay

### Requirement: Wizard welcome displays illo3d branding

The wizard welcome screen SHALL display the illo3d brand name and a brief tagline. The layout SHALL be centered on the viewport with a clean, professional appearance using Tailwind CSS.

#### Scenario: Welcome screen shows branding

- **WHEN** the wizard welcome screen renders
- **THEN** the user sees the "illo3d" brand name and a descriptive tagline

### Requirement: Google Drive backend option triggers OAuth (no standalone login-page button)

The wizard welcome screen SHALL surface the "Google Drive" backend option which triggers OAuth. There is no standalone "Sign in with Google" button on a separate login page; OAuth is initiated as a side effect of backend selection (GIS One Tap MAY still apply elsewhere per browser support).

#### Scenario: Google Drive option triggers OAuth

- **WHEN** the wizard welcome screen renders
- **THEN** the "Google Drive" button is visible
- **AND** clicking it initiates the Google OAuth flow with all required scopes

### Requirement: Legacy `/login` URL redirects to home

The system SHALL redirect users who navigate to `/login` to `/`. If an active shop exists, the wizard does not appear. If no active shop exists, the wizard overlay appears.

#### Scenario: User navigates to /login with active shop

- **WHEN** a user with an active shop navigates to `/login`
- **THEN** the system redirects to `/` and the dashboard loads

#### Scenario: User navigates to /login without active shop

- **WHEN** a user without an active shop navigates to `/login`
- **THEN** the system redirects to `/` and the wizard overlay appears

#### Scenario: Authenticated user with preserved return path

- **WHEN** an authenticated user arrives at `/login` with a preserved return path
- **THEN** the system redirects them to that return path after normalization rules apply

### Requirement: Wizard welcome text supports i18n

All user-facing text on the wizard welcome screen (tagline, instructions, backend labels) SHALL use i18next translation keys so they can be localized.

#### Scenario: Welcome screen text is translatable

- **WHEN** the wizard welcome screen renders
- **THEN** all visible text is sourced from i18n keys

## Route protection

### Requirement: Users without an active shop see the wizard

The system SHALL show the setup wizard overlay when no active shop is set, regardless of whether the user has completed Google sign-in. The underlying route MAY render but the wizard blocks interaction until a shop exists or the user cancels to an explicit welcome state.

#### Scenario: User without shop sees wizard on protected route

- **WHEN** a user navigates to a protected route (e.g. `/transactions`)
- **AND** no active shop is set in the shop store
- **THEN** the wizard modal overlay appears on top of the page content

#### Scenario: User with shop accesses routes normally

- **WHEN** a user navigates to any protected route
- **AND** an active shop is set in the shop store
- **THEN** the page renders normally without the wizard overlay (subject to other auth rules)

### Requirement: Authenticated users can access protected routes when a shop exists

The system SHALL allow users with `isAuthenticated` true and an active shop to use protected routes without auth-related redirection.

#### Scenario: Authenticated user with shop navigates

- **WHEN** `isAuthenticated` is true and an active shop exists
- **THEN** protected routes render without auth-related redirection

### Requirement: Route guard reads auth and shop state reactively

The system SHALL use the auth store and shop store reactively. If the user signs out while on a protected route, the system SHALL clear session state and show the wizard welcome flow (not a standalone `/login` page).

#### Scenario: User signs out on a protected page

- **WHEN** an authenticated user triggers sign-out while on `/transactions`
- **THEN** credentials and shop state are cleared as defined elsewhere
- **AND** the user sees the wizard welcome screen when appropriate

### Requirement: Originally requested path may be preserved for post-shop navigation

The system MAY preserve the originally requested URL so that after the user completes wizard onboarding (shop created or opened), the app can navigate to that path.

#### Scenario: Return path after shop is ready

- **WHEN** a return path was preserved before onboarding completed
- **AND** the user completes the wizard with an active shop
- **THEN** the system MAY redirect them to the preserved path
