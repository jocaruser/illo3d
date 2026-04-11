# authentication Specification

## Purpose

End-to-end authentication for illo3d: Google Identity Services (One Tap and OAuth), credentials and session storage, the public login experience, development-only fixture login for tests and local work, and route protection with return-path preservation.

## Google OAuth and API configuration

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

### Requirement: Auth UI strings support i18n

All user-facing auth strings (sign-in button, signed-in message, sign-out) SHALL use i18next so they can be translated.

#### Scenario: Auth strings are translatable

- **WHEN** app renders auth UI
- **THEN** text comes from i18n keys (e.g. `auth.signIn`, `auth.signedInAs`, `auth.signOut`)

## Login page

### Requirement: Login page is publicly accessible

The system SHALL render the login page at `/login` without requiring authentication. This SHALL be the only public route in the application.

#### Scenario: Unauthenticated user can view the login page

- **WHEN** an unauthenticated user navigates to `/login`
- **THEN** the login page renders with branding and sign-in options

### Requirement: Login page displays illo3d branding

The system SHALL display the illo3d brand name and a brief tagline on the login page. The layout SHALL be centered on the viewport with a clean, professional appearance using Tailwind CSS.

#### Scenario: Login page shows branding

- **WHEN** the login page renders
- **THEN** the user sees the "illo3d" brand name and a descriptive tagline

### Requirement: Login page presents Google sign-in alongside OAuth behavior

The system SHALL surface Google sign-in on the login page per the Google OAuth requirements. The "Sign in with Google" button SHALL render as soon as the GIS script finishes loading, without artificial delay. One Tap SHALL operate as a parallel enhancement alongside the visible button.

#### Scenario: Google Sign-In button appears promptly

- **WHEN** the login page loads
- **THEN** the "Sign in with Google" button SHALL be visible as soon as the GIS script finishes loading, without any artificial delay

#### Scenario: Google One Tap appears alongside the button

- **WHEN** the login page loads and One Tap is available
- **THEN** the Google One Tap prompt appears as an overlay while the sign-in button remains visible

#### Scenario: Successful sign-in from login page

- **WHEN** the user completes Google sign-in (via One Tap or button)
- **THEN** auth state updates and the user is redirected to the app

### Requirement: Authenticated users are redirected away from login

The system SHALL redirect authenticated users who navigate to `/login` to the default authenticated route. If an active shop exists, redirect to `/transactions`. If no active shop exists, the user will see the wizard overlay on the main layout. If a return path was preserved from a prior redirect, the system SHALL redirect to that path instead.

#### Scenario: Authenticated user visits login page

- **WHEN** an authenticated user navigates to `/login`
- **THEN** the system redirects them to `/` (which shows wizard if no shop, or app content if shop is active)

#### Scenario: Authenticated user with preserved return path

- **WHEN** an authenticated user arrives at `/login` with a preserved return path
- **THEN** the system redirects them to that return path

### Requirement: Login page text supports i18n

All user-facing text on the login page (tagline, instructions) SHALL use i18next translation keys so they can be localized.

#### Scenario: Login page text is translatable

- **WHEN** the login page renders
- **THEN** all visible text is sourced from i18n keys (e.g., `login.tagline`, `login.title`)

## Dev login (development only)

### Requirement: Dev login button is visible only in development mode

The system SHALL display a "Dev Login" button on the login page only when `import.meta.env.DEV` is `true`. The button SHALL NOT be rendered in production builds.

#### Scenario: Dev login button visible in development

- **WHEN** the login page renders in development mode (`import.meta.env.DEV === true`)
- **THEN** a "Dev Login" button is visible below the Google sign-in options, visually separated (e.g., with a divider)

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

#### Scenario: Dev Login click is instant

- **WHEN** the user clicks "Dev Login" in development mode
- **THEN** the button does not show a loading state and the user is immediately redirected to the app with fixture data loaded

### Requirement: Dev login UI strings support i18n

All user-facing text related to dev login (button label) SHALL use i18next translation keys.

#### Scenario: Dev login text is translatable

- **WHEN** the dev login button renders
- **THEN** all visible text is sourced from i18n keys

## Route protection

### Requirement: Unauthenticated users are redirected to login

The system SHALL redirect unauthenticated users to `/login` when they attempt to access any protected route. The redirect SHALL preserve the originally requested path so the user can be sent there after signing in.

#### Scenario: Unauthenticated user visits a protected route

- **WHEN** an unauthenticated user navigates to `/transactions`
- **THEN** the system redirects them to `/login`

#### Scenario: Unauthenticated user visits any new protected route

- **WHEN** an unauthenticated user navigates to any route other than `/login`
- **THEN** the system redirects them to `/login`

### Requirement: Authenticated users can access all protected routes

The system SHALL allow authenticated users (where `isAuthenticated` is `true` in the auth store) to access any protected route without redirection.

#### Scenario: Authenticated user navigates to a protected route

- **WHEN** an authenticated user navigates to `/transactions`
- **THEN** the page renders normally without redirection

### Requirement: Wizard overlay appears for authenticated users without active shop

The system SHALL show the setup wizard modal overlay when a user is authenticated but has no active shop. This applies to all protected routes — the underlying page may render but the wizard overlay blocks interaction until a shop is selected.

#### Scenario: Authenticated user without shop sees wizard overlay

- **WHEN** an authenticated user navigates to any protected route
- **AND** no active shop is set in the shop store
- **THEN** the wizard modal overlay appears on top of the page content

#### Scenario: Authenticated user with shop accesses routes normally

- **WHEN** an authenticated user navigates to any protected route
- **AND** an active shop is set in the shop store
- **THEN** the page renders normally without the wizard overlay

### Requirement: Route guard reads auth state reactively

The system SHALL use the Zustand auth store's `isAuthenticated` state to determine access. If the user signs out while on a protected route, the system SHALL redirect them to `/login`.

#### Scenario: User signs out on a protected page

- **WHEN** an authenticated user triggers sign-out while on `/transactions`
- **THEN** the system redirects them to `/login`

### Requirement: Originally requested path is preserved on redirect

The system SHALL pass the originally requested URL as state or query parameter when redirecting to `/login`, so that after successful authentication the user can be redirected back.

#### Scenario: Redirect after login returns to original path

- **WHEN** an unauthenticated user is redirected from `/transactions` to `/login`
- **AND** the user successfully authenticates
- **THEN** the system redirects them to `/transactions`
