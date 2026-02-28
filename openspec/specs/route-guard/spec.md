# route-guard Specification

## Purpose
Route protection ensuring unauthenticated users are redirected to the login page, with return path preservation.

## Requirements

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
