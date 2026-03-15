# e2e-spec-coverage Specification

## Purpose

Ensure Playwright e2e tests exist for every OpenSpec spec that has browser-testable scenarios, providing regression protection and verification that implemented behavior matches documented requirements.

## Requirements

### Requirement: E2E tests cover login-page and dev-login specs

The system SHALL have Playwright e2e tests that verify all browser-testable scenarios from the login-page and dev-login specs. Tests SHALL use the existing `login.spec.ts` file or extend it. Dev Login SHALL be used for authenticated flows (no real OAuth).

#### Scenario: Login page renders with branding
- **WHEN** an unauthenticated user navigates to `/login`
- **THEN** the login page displays "illo3d" brand and sign-in options

#### Scenario: Dev Login button visible in development
- **WHEN** the login page renders in development mode
- **THEN** a "Dev Login" button is visible

#### Scenario: Dev Login navigates to transactions
- **WHEN** the user clicks "Dev Login"
- **THEN** the user is redirected to `/transactions` (or default authenticated route) with app content visible

#### Scenario: Sign in with Google button visible
- **WHEN** the login page loads
- **THEN** the "Sign in with Google" button is visible

### Requirement: E2E tests cover route-guard spec

The system SHALL have Playwright e2e tests that verify route protection: unauthenticated users redirect to login, authenticated users access protected routes, return path preservation, and wizard overlay when no shop exists.

#### Scenario: Unauthenticated user redirected to login
- **WHEN** an unauthenticated user navigates to `/transactions`
- **THEN** the system redirects to `/login`

#### Scenario: Authenticated user accesses protected route
- **WHEN** an authenticated user (via Dev Login) navigates to `/transactions`
- **THEN** the page renders without redirection

#### Scenario: Redirect after login returns to original path
- **WHEN** an unauthenticated user is redirected from `/transactions` to `/login`
- **AND** the user clicks Dev Login
- **THEN** the system redirects them to `/transactions`

#### Scenario: User without shop sees wizard overlay
- **WHEN** an authenticated user without active shop navigates to a protected route
- **THEN** the wizard modal overlay appears

### Requirement: E2E tests cover setup-wizard spec (browser-testable scenarios)

The system SHALL have Playwright e2e tests for setup-wizard scenarios that do not require real Google Drive API: step 1 choice (create/open/cancel), Cancel logs out, validation errors for empty folder name, and wizard visibility. Scenarios requiring Drive creation or Picker selection MAY be deferred or tested with mocked responses.

#### Scenario: Wizard step 1 shows create/open choice
- **WHEN** authenticated user without shop sees wizard
- **THEN** user sees "Create new shop", "Open existing folder", and "Cancel" options

#### Scenario: Cancel logs user out
- **WHEN** user clicks "Cancel" on wizard step 1
- **THEN** user is redirected to `/login`

#### Scenario: Empty folder name rejected
- **WHEN** user chooses create, leaves name empty, and clicks "Create"
- **THEN** validation error is shown and wizard does not proceed

#### Scenario: Wizard dismissed when shop is set
- **WHEN** user has active shop (e.g., via Dev Login fixture)
- **THEN** wizard does not appear and app content is usable

### Requirement: E2E tests cover money-tracking spec (transactions UI)

The system SHALL have Playwright e2e tests for the transactions view: table renders with data or empty state, balance displays, amount sign convention (income positive, expense negative), and read-only behavior (no edit/add/delete controls).

#### Scenario: Transactions table renders after login
- **WHEN** authenticated user navigates to `/transactions`
- **THEN** transactions table or empty state is visible

#### Scenario: Balance displayed
- **WHEN** user views transactions
- **THEN** a balance (sum of amounts) is displayed

#### Scenario: No edit controls in transactions UI
- **WHEN** user views transactions table
- **THEN** no add, edit, or delete buttons are visible

### Requirement: E2E tests run via Makefile and pass in CI

The system SHALL run all e2e tests via `make e2e-test`. The Playwright base URL SHALL be `http://web:5173` (dev server) when run in Docker. All e2e tests SHALL pass with zero failures before considering implementation complete.

#### Scenario: E2E tests run via Makefile
- **WHEN** developer runs `make e2e-test`
- **THEN** Playwright executes all e2e spec files and reports results

#### Scenario: E2E tests pass in CI
- **WHEN** CI runs `make e2e-test`
- **THEN** all tests pass with exit code 0
