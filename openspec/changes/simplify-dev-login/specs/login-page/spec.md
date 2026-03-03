## MODIFIED Requirements

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
