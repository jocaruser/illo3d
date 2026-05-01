## ADDED Requirements

### Requirement: ProtectedRoute redirects unauthenticated users

The system SHALL check `isAuthenticated` inside `ProtectedRoute`. When `isAuthenticated` is false, the component SHALL render a redirect to `/` instead of its children. When `isAuthenticated` is true, it SHALL render its children wrapped in the existing `RouteErrorBoundary`.

#### Scenario: Unauthenticated user visits dashboard
- **WHEN** an unauthenticated user navigates to `/#/dashboard`
- **THEN** the system redirects to `/#/`
- **AND** the dashboard content is not rendered

#### Scenario: Authenticated user visits dashboard
- **WHEN** an authenticated user navigates to `/#/dashboard`
- **THEN** the dashboard content renders normally
- **AND** the `RouteErrorBoundary` is active

#### Scenario: Local user visits protected route
- **WHEN** a local-files user (`isAuthenticated` true, no Google credentials) navigates to `/#/clients`
- **THEN** the clients page renders normally
