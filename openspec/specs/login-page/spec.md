# login-page Specification

## Purpose
Dedicated login page with illo3d branding and Google sign-in integration.

## Requirements

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

### Requirement: Login page integrates Google sign-in

The system SHALL display Google sign-in options on the login page: Google One Tap (when available) and a "Sign in with Google" button. The button SHALL render immediately when the page loads (without waiting for One Tap to fail or a timeout to expire). One Tap SHALL operate as a parallel enhancement alongside the visible button. In development mode, a "Dev Login" button SHALL also be displayed below the Google sign-in options, visually separated. Clicking "Dev Login" SHALL immediately inject fixture auth and shop state and navigate to the app without any loading state or async operations.

#### Scenario: Google Sign-In button appears immediately

- **WHEN** the login page loads
- **THEN** the "Sign in with Google" button SHALL be visible as soon as the GIS script finishes loading, without any artificial delay

#### Scenario: Google One Tap appears alongside the button

- **WHEN** the login page loads and One Tap is available
- **THEN** the Google One Tap prompt appears as an overlay while the sign-in button remains visible

#### Scenario: Fallback sign-in button appears when One Tap unavailable

- **WHEN** Google One Tap is unavailable or dismissed
- **THEN** the login page continues to display the "Sign in with Google" button (already visible)

#### Scenario: Successful sign-in from login page

- **WHEN** the user completes Google sign-in (via One Tap or button)
- **THEN** auth state updates and the user is redirected to the app

#### Scenario: Dev Login button visible in development mode

- **WHEN** the login page renders and `import.meta.env.DEV` is `true`
- **THEN** a "Dev Login" button is displayed below the Google sign-in button, visually separated (e.g., with a divider)

#### Scenario: Dev Login button hidden in production

- **WHEN** the login page renders and `import.meta.env.DEV` is `false`
- **THEN** no "Dev Login" button is present in the DOM

#### Scenario: Dev Login click is instant

- **WHEN** the user clicks "Dev Login" in development mode
- **THEN** the button does not show a loading state and the user is immediately redirected to the app with fixture data loaded

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
