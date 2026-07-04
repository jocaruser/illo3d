# playwright-fixture-serving Specification

## Purpose

Provide e2e test infrastructure for serving fixture files from an ephemeral `.e2e-fixtures/` directory using Playwright route interception, removing the need for a dedicated Vite dev server for e2e tests.

## Requirements

### Requirement: Playwright route interception serves fixture files from ephemeral directory

The Playwright test infrastructure SHALL intercept HTTP requests to `/fixtures/**` and serve files from the `.e2e-fixtures/` directory on the host filesystem. The route handler SHALL read the requested file from `.e2e-fixtures/` and return its contents with the appropriate Content-Type header (text/csv for .csv files, application/json for .json files). The route handler SHALL return a 404 response if the requested file does not exist.

#### Scenario: Fixture CSV file served via route interception

- **WHEN** a Playwright test triggers a fetch to `/fixtures/happy-path/illo3d.metadata.json`
- **THEN** the route handler reads the file from `.e2e-fixtures/happy-path/illo3d.metadata.json`
- **AND** returns the file contents with Content-Type `application/json`
- **AND** the response status is 200

#### Scenario: Fixture CSV file served with correct content type

- **WHEN** a Playwright test triggers a fetch to `/fixtures/happy-path/transactions.csv`
- **THEN** the route handler reads the file from `.e2e-fixtures/happy-path/transactions.csv`
- **AND** returns the file contents with Content-Type `text/csv; charset=utf-8`
- **AND** the response status is 200

#### Scenario: Missing fixture file returns 404

- **WHEN** a Playwright test triggers a fetch to `/fixtures/nonexistent/file.csv`
- **THEN** the route handler returns a 404 response
- **AND** the test can detect the missing fixture

### Requirement: Route interception is registered before fixture fetch

The Playwright test infrastructure SHALL register the `/fixtures/**` route interception before any test code attempts to fetch fixture files. The route interception SHALL be registered in the `mockDirectoryPicker` helper function, which is called during test setup.

#### Scenario: Route interception active before fixture fetch

- **WHEN** `mockDirectoryPicker` is called with a scenario name
- **THEN** the route interception for `/fixtures/**` is registered
- **AND** subsequent fetches to `/fixtures/<scenario>/*` are intercepted and served from `.e2e-fixtures/`

#### Scenario: Route interception persists across page navigations

- **WHEN** a test navigates to a new page after `mockDirectoryPicker` is called
- **THEN** the route interception remains active
- **AND** fixture fetches on the new page are still intercepted

### Requirement: Route interception does not affect non-fixture requests

The Playwright route interception SHALL only intercept requests matching the `/fixtures/**` pattern. All other requests SHALL pass through to the dev server unchanged.

#### Scenario: Non-fixture request passes through

- **WHEN** a request is made to `/api/sheets/append`
- **THEN** the request is NOT intercepted by the fixture route handler
- **AND** the request reaches the dev server normally

#### Scenario: Static asset request passes through

- **WHEN** a request is made to `/src/main.tsx` or other static assets
- **THEN** the request is NOT intercepted by the fixture route handler
- **AND** the request reaches the dev server normally
