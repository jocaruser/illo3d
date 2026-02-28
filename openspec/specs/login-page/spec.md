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

The system SHALL display Google sign-in options on the login page: Google One Tap (when available) and a fallback "Sign in with Google" button. This replaces the sign-in UI previously in the header.

#### Scenario: Google One Tap appears on login page
- **WHEN** the login page loads and One Tap is available
- **THEN** the Google One Tap prompt appears

#### Scenario: Fallback sign-in button appears
- **WHEN** Google One Tap is unavailable or dismissed
- **THEN** the login page displays a "Sign in with Google" button

#### Scenario: Successful sign-in from login page
- **WHEN** the user completes Google sign-in (via One Tap or fallback)
- **THEN** auth state updates and the user is redirected to the app

### Requirement: Authenticated users are redirected away from login

The system SHALL redirect authenticated users who navigate to `/login` to the default authenticated route (`/transactions`). If a return path was preserved from a prior redirect, the system SHALL redirect to that path instead.

#### Scenario: Authenticated user visits login page
- **WHEN** an authenticated user navigates to `/login`
- **THEN** the system redirects them to `/transactions`

#### Scenario: Authenticated user with preserved return path
- **WHEN** an authenticated user arrives at `/login` with a preserved return path of `/transactions`
- **THEN** the system redirects them to that return path

### Requirement: Login page text supports i18n

All user-facing text on the login page (tagline, instructions) SHALL use i18next translation keys so they can be localized.

#### Scenario: Login page text is translatable
- **WHEN** the login page renders
- **THEN** all visible text is sourced from i18n keys (e.g., `login.tagline`, `login.title`)
