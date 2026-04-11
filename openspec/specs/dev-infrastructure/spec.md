# dev-infrastructure Specification

## Purpose

Developer workflow and quality for illo3d: Docker-based Node/pnpm environment, Makefile commands (including `restore-fixtures` and `e2e-test` with a dedicated e2e Vite server and ephemeral fixtures), project hygiene (ignore files, env template), root README for onboarding, scaffold expectations, mandatory quality gates (build, lint, unit tests, e2e), Playwright coverage mapped to feature specs, shared e2e auth/shop setup, multi-scenario fixtures, dialog-gated control assertions, and documented Playwright execution policy (workers, serial, optional browsers).

## Repository documentation

### Requirement: Root README documents developer onboarding

The repository SHALL include a `README.md` file at the project root. The README SHALL provide a concise overview of illo3d (3D print shop management), list prerequisites (Docker and `make`), document first-time setup using `make init` and day-to-day development with `make dev`, summarize the tech stack (React, TypeScript, Vite, Tailwind, testing tools as used in the repo), group available Makefile targets by purpose (e.g. setup, Docker, development, quality, utilities), and explain how to run automated checks: `make test`, `make e2e-test`, and the full `make quality-gate` sequence.

#### Scenario: New developer follows README setup

- **WHEN** a developer clones the repository and reads `README.md`
- **THEN** they can run `make init` and `make dev` as documented without consulting other docs for basic setup

#### Scenario: README lists quality commands

- **WHEN** a developer reads the quality or testing section of `README.md`
- **THEN** the document describes `make test`, `make e2e-test`, and `make quality-gate` and what each is for

## Docker development environment

### Requirement: Container provides Node.js development environment

The Docker container SHALL provide Node.js 20 LTS with pnpm package manager pre-installed. The container SHALL keep running until explicitly stopped.

#### Scenario: Container starts successfully

- **WHEN** user runs `make up` or `docker compose up -d`
- **THEN** container starts and remains running

#### Scenario: Node and pnpm are available

- **WHEN** user runs `make bash-exec CMD="node --version"`
- **THEN** output shows Node.js version 20.x

### Requirement: Makefile provides development workflow commands

The Makefile SHALL provide shortcuts for all common development operations. Commands SHALL execute inside the Docker container.

#### Scenario: Initialize project

- **WHEN** user runs `make init` on a fresh clone
- **THEN** Docker image is built, container starts, and dependencies are installed

#### Scenario: Start development server

- **WHEN** user runs `make dev`
- **THEN** Vite dev server starts and is accessible at http://localhost:5173

#### Scenario: Install dependencies

- **WHEN** user runs `make install`
- **THEN** pnpm install executes in container and node_modules appears on host

#### Scenario: Add new package

- **WHEN** user runs `make add PKG=lodash`
- **THEN** lodash is added to dependencies via pnpm

#### Scenario: Run arbitrary command

- **WHEN** user runs `make bash-exec CMD="pnpm outdated"`
- **THEN** the command executes inside the container

#### Scenario: Open interactive shell

- **WHEN** user runs `make shell`
- **THEN** user gets an interactive shell inside the container

### Requirement: Makefile provides fixture restore command

The Makefile SHALL provide a `restore-fixtures` target that copies all golden fixture folders from `fixtures/` to `public/fixtures/`, replacing any existing content. This target SHALL run on the host (not inside Docker) since `public/fixtures/` is bind-mounted.

#### Scenario: Restore fixtures from golden source

- **WHEN** developer runs `make restore-fixtures`
- **THEN** all contents of `public/fixtures/` are removed
- **AND** all folders and files from `fixtures/` are copied to `public/fixtures/`
- **AND** the copy is identical to the golden source

#### Scenario: Restore is idempotent

- **WHEN** developer runs `make restore-fixtures` multiple times
- **THEN** each run produces the same result
- **AND** `public/fixtures/` matches `fixtures/` exactly after each run

### Requirement: E2E tests use dedicated Vite server with ephemeral fixtures

The e2e test infrastructure SHALL start a dedicated Vite dev server for e2e tests, separate from the developer's `make dev` server. This server SHALL serve fixtures from an ephemeral directory (e.g. `.e2e-fixtures/`), not from `public/fixtures/`. The server SHALL run on a different port (e.g. 5174) to avoid conflicts with the dev server.

#### Scenario: E2E server starts with ephemeral fixture directory

- **WHEN** `make e2e-test` runs
- **THEN** a Vite dev server starts with `VITE_FIXTURES_ROOT` pointing to the ephemeral directory
- **AND** the server listens on a port different from the dev server
- **AND** the server serves fixture files from the ephemeral directory

#### Scenario: E2E server does not affect dev server

- **WHEN** e2e tests run while `make dev` is also running
- **THEN** the dev server at port 5173 continues serving `public/fixtures/` unchanged
- **AND** the e2e server operates independently on its own port

### Requirement: E2E specs restore fixtures before each test

The Playwright test infrastructure SHALL provide a custom fixture (`fixtureScenario`) that copies the declared scenario from `fixtures/` to the e2e ephemeral directory before each test. The default scenario SHALL be `happy-path`. Specs MAY override the scenario via `test.use({ fixtureScenario: '<name>' })`.

#### Scenario: Each spec starts from pristine state

- **WHEN** a Playwright spec begins execution
- **THEN** the fixture infrastructure copies the declared scenario to the ephemeral directory
- **AND** any data from previous tests is replaced

#### Scenario: Spec uses custom fixture scenario

- **WHEN** a spec declares `test.use({ fixtureScenario: 'empty' })`
- **THEN** `fixtures/empty/` is copied to the ephemeral directory before the spec runs

#### Scenario: Spec uses default fixture scenario

- **WHEN** a spec does not declare a fixtureScenario
- **THEN** `fixtures/happy-path/` is copied to the ephemeral directory before the spec runs

#### Scenario: Non-default scenario materializes data for spreadsheet IDs and wizard

- **WHEN** a spec uses `fixtureScenario` that differs from the folder configured for Local CSV wizard open (e.g. `VITE_LOCAL_CSV_FIXTURE_FOLDER` is `happy-path` while the scenario is `empty`)
- **THEN** the test infrastructure copies the golden scenario into an ephemeral path for that scenario **and** into the wizard-configured folder so Dev Login shop open and CSV reads derived from `spreadsheetId` (e.g. `csv-fixture-*`) both resolve

### Requirement: E2E suite supports at least two fixture scenarios in practice

The repository SHALL include at least two distinct folders under `fixtures/` used by e2e (e.g. `happy-path` and `empty` or `minimal`). At least one Playwright spec SHALL declare a non-default scenario via `test.use({ fixtureScenario: '<name>' })` when that scenario is required for the behavior under test.

#### Scenario: Spec declares non-default fixture scenario

- **WHEN** a test requires data that differs from happy-path
- **THEN** the test sets `fixtureScenario` to the appropriate folder name
- **AND** the golden data for that scenario exists under `fixtures/<name>/`

### Requirement: Project files are bind-mounted to container

The project directory SHALL be bind-mounted so changes on host are immediately visible in container and vice versa. This includes node_modules.

#### Scenario: Code changes reflect immediately

- **WHEN** user edits a source file on host
- **THEN** Vite dev server detects the change and triggers HMR

#### Scenario: node_modules visible on host

- **WHEN** dependencies are installed via `make install`
- **THEN** node_modules directory appears on host filesystem for IDE access

### Requirement: Ignore files protect secrets and reduce noise

The project SHALL include .gitignore, .cursorignore, and .dockerignore files that prevent secrets from being committed, indexed by AI, or included in Docker builds.

#### Scenario: .env files are git-ignored

- **WHEN** user creates or modifies .env file
- **THEN** git status does not show .env as a tracked or modified file

#### Scenario: AI agents cannot read secrets

- **WHEN** AI agent attempts to read .env file
- **THEN** .cursorignore prevents the file from being indexed or read

#### Scenario: node_modules excluded from Docker build context

- **WHEN** Docker image is built
- **THEN** node_modules is not copied into the build context (uses .dockerignore)

### Requirement: Environment template documents required configuration

The project SHALL include a .env.example file documenting required environment variables without actual secret values.

#### Scenario: New developer setup

- **WHEN** developer clones repository and runs `make init`
- **THEN** .env.example is copied to .env if .env does not exist

### Requirement: React application scaffold is initialized

The project SHALL include a complete React + TypeScript + Vite scaffold with Tailwind CSS, ESLint, Prettier, and testing infrastructure.

#### Scenario: Build produces static files

- **WHEN** user runs `make build`
- **THEN** dist/ directory contains index.html and bundled assets

#### Scenario: Tests can be executed

- **WHEN** user runs `make test`
- **THEN** vitest runs and reports test results

#### Scenario: Linting works

- **WHEN** user runs `make lint`
- **THEN** ESLint checks source files and reports any issues

## Quality gate

### Requirement: Build produces zero errors

The TypeScript compiler and Vite bundler SHALL complete without errors when running `make build`. All type errors, unused variable warnings, and configuration issues MUST be resolved.

#### Scenario: Clean TypeScript compilation

- **WHEN** developer runs `make build`
- **THEN** `tsc -b` completes with exit code 0 and no error output

#### Scenario: Vite bundle succeeds

- **WHEN** TypeScript compilation passes
- **THEN** `vite build` produces a `dist/` directory with bundled assets

### Requirement: Linter reports zero errors

ESLint SHALL report zero errors and zero warnings when running `make lint`. All unused imports, unused variables, and code quality violations MUST be resolved.

#### Scenario: Clean lint run

- **WHEN** developer runs `make lint`
- **THEN** ESLint exits with code 0 and reports 0 problems

### Requirement: All tests pass

The full test suite SHALL pass when running `make test`. Stale tests MUST be updated to match current component behavior.

#### Scenario: Full test suite passes

- **WHEN** developer runs `make test`
- **THEN** vitest reports all test files passed with 0 failures

### Requirement: E2E tests pass

The full Playwright e2e test suite SHALL pass when running `make e2e-test`. All e2e tests SHALL use Dev Login for authenticated flows and SHALL NOT rely on real Google OAuth in CI.

#### Scenario: Full e2e suite passes

- **WHEN** developer runs `make e2e-test`
- **THEN** Playwright reports all e2e spec files passed with 0 failures

#### Scenario: E2E tests run in CI

- **WHEN** CI pipeline executes quality checks
- **THEN** `make e2e-test` runs and must succeed for the pipeline to pass

### Requirement: Cursor rule enforces quality gates

A Cursor rule SHALL exist that instructs AI agents to validate build, lint, test, and e2e-test results before considering implementation complete. The rule SHALL also enforce that all pnpm and docker commands are executed through Makefile targets.

#### Scenario: AI agent validates quality after changes

- **WHEN** AI agent completes a code change
- **THEN** the agent runs `make build`, `make lint`, `make test`, and `make e2e-test` to verify zero errors before finishing

#### Scenario: AI agent uses Makefile commands

- **WHEN** AI agent needs to install a dependency
- **THEN** the agent uses `make add PKG=<name>` instead of `pnpm add <name>` or `docker compose exec app pnpm add <name>`

#### Scenario: AI agent uses Makefile for all operations

- **WHEN** AI agent needs to run any development command (dev, build, test, e2e-test, lint, format, install)
- **THEN** the agent uses the corresponding `make` target instead of running pnpm or docker commands directly

## E2E coverage

### Requirement: E2E tests use a single shared authenticated shop setup

The Playwright test suite SHALL provide one canonical mechanism (e.g. extended fixture or equivalent) that performs Dev Login and opens the Local CSV shop for the default e2e scenario. Authenticated specs that need an open shop SHALL use this mechanism instead of duplicating equivalent helper functions in each spec file.

#### Scenario: Spec obtains ready-to-use authenticated shop session

- **WHEN** a Playwright test that requires an open shop runs
- **THEN** the shared setup performs Dev Login and completes the CSV shop open flow for the active `fixtureScenario`
- **AND** the test does not rely on a copy-pasted login helper unique to that file

### Requirement: E2E assertions honor dialog-gated and controlled fields

Playwright tests that interact with controlled `<select>` fields or other controls that open a confirmation dialog before commit SHALL assert the stale value immediately after the interaction when the product keeps the prior value until confirm. Tests SHALL assert the committed value and any dependent visible UI after the dialog completes and data settles. Tests that commit immediately (no dialog) SHALL assert the new value without an incorrect stale expectation.

#### Scenario: Dialog-gated status change is asserted in two phases

- **WHEN** a test changes a job status that opens a confirmation dialog
- **THEN** the test asserts the select retains the pre-dialog value until confirm
- **AND** after confirm, the test asserts the select matches the chosen status

### Requirement: E2E tests cover authentication spec (login and dev login)

The system SHALL have Playwright e2e tests that verify browser-testable scenarios from the authentication spec for the login page and dev login. Tests SHALL use the existing `login.spec.ts` file or extend it. Dev Login SHALL be used for authenticated flows (no real OAuth).

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

### Requirement: E2E tests cover authentication spec (route protection)

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

### Requirement: E2E tests cover shop-lifecycle spec (wizard, browser-testable)

The system SHALL have Playwright e2e tests for shop-lifecycle wizard scenarios that do not require real Google Drive API: step 1 storage and action choices, Cancel logs out, validation errors for empty folder name on Google create flow, and wizard visibility when no shop. Scenarios requiring Drive creation or Picker selection MAY be deferred or tested with mocked responses.

#### Scenario: Wizard step 1 shows storage and action choices

- **WHEN** authenticated user without shop sees wizard
- **THEN** user sees Local CSV and Google Drive storage options
- **AND** sees Create new shop, Open existing shop, and Cancel

#### Scenario: Cancel logs user out

- **WHEN** user clicks "Cancel" on wizard step 1
- **THEN** user is redirected to `/login`

#### Scenario: Empty folder name rejected (Google Drive create)

- **WHEN** user selects Google Drive, chooses create, leaves name empty, and clicks "Create"
- **THEN** validation error is shown and wizard does not proceed

#### Scenario: Wizard dismissed when shop is set

- **WHEN** user has active shop (e.g., via Dev Login fixture)
- **THEN** wizard does not appear and app content is usable

### Requirement: E2E tests cover money-tracking spec (transactions UI)

The system SHALL have Playwright e2e tests for the transactions view: table renders with data or empty state, balance displays, amount sign convention (income positive, expense negative), and read-only behavior for the table (no edit/add/delete controls on the table itself).

#### Scenario: Transactions table renders after login

- **WHEN** authenticated user navigates to `/transactions`
- **THEN** transactions table or empty state is visible

#### Scenario: Balance displayed

- **WHEN** user views transactions
- **THEN** a balance (sum of amounts) is displayed

#### Scenario: No edit controls on transactions table

- **WHEN** user views transactions table
- **THEN** no add, edit, or delete controls are visible on the table itself

### Requirement: E2E tests cover Pieces primary UI

The system SHALL have at least one Playwright spec that verifies an authenticated user can reach the Pieces route from the app chrome and sees the expected primary content (e.g. heading and table or documented empty state) using the default or declared fixture scenario.

#### Scenario: Pieces view renders for authenticated user

- **WHEN** an authenticated user with an open shop navigates to the Pieces page
- **THEN** the page shows the expected heading for Pieces
- **AND** the user sees a table or the documented empty state consistent with the fixture

### Requirement: E2E tests cover Expenses list after creation flow

The system SHALL have Playwright coverage that verifies the Expenses list view shows data consistent with a completed create-expense flow (e.g. row or summary visible for submitted values), in addition to any URL redirect assertion.

#### Scenario: Created expense visible on expenses page

- **WHEN** a user completes create expense from the transactions flow with identifiable field values
- **AND** the app navigates to the expenses view
- **THEN** the expenses UI shows content that reflects those values within a bounded timeout

### Requirement: E2E tests run via Makefile and pass in CI

The system SHALL run all e2e tests via `make e2e-test`. The e2e target SHALL start a dedicated Vite server with ephemeral fixtures, run Playwright against it, and clean up afterward. The target SHALL NOT modify `public/fixtures/`. All e2e tests SHALL pass with zero failures before considering implementation complete.

#### Scenario: E2E tests run via Makefile

- **WHEN** developer runs `make e2e-test`
- **THEN** Playwright executes all e2e spec files against the dedicated e2e server
- **AND** reports results

#### Scenario: E2E tests pass in CI

- **WHEN** CI runs `make e2e-test`
- **THEN** all tests pass with exit code 0

#### Scenario: E2E tests do not modify dev fixtures

- **WHEN** `make e2e-test` completes (pass or fail)
- **THEN** `public/fixtures/` is unchanged from before the run

### Requirement: Playwright configuration documents execution policy

The Playwright configuration or project documentation SHALL state how many workers are used locally and in CI, when `serial` mode is required, and whether an additional browser project (e.g. Firefox) can be enabled via environment variable. The default `make e2e-test` path SHALL remain green without mandatory extra browsers.

#### Scenario: Default e2e remains Chromium-only

- **WHEN** a developer runs `make e2e-test` with no extra env flags
- **THEN** Playwright runs the primary Chromium project and all tests pass

#### Scenario: Optional secondary browser is documented

- **WHEN** a maintainer enables the documented optional browser flag in CI or locally
- **THEN** the same specs execute against the additional project without changing production code
