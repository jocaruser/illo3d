## MODIFIED Requirements

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
- **THEN** credentials are cleared, auth state updates to signed out, and the route guard redirects to `/login`
