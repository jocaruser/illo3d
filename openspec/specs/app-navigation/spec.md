# app-navigation Specification

## Purpose

Define how the authenticated app shell shows **current section** in the top navigation and a **breadcrumb** trail on main data pages so users always know where they are.

## Requirements

### Requirement: Top navigation shows active section

The system SHALL render primary section links (Clients, Jobs, Transactions, Expenses, Inventory) in the app header. When the user is authenticated and has an **active shop**, the system SHALL also render the **global entity search** control in the header (alongside—not instead of—section links). The link whose route matches the current location SHALL use visually distinct styling from inactive links so users can see which page they are on. The logo or home link behavior SHALL NOT cause every route to appear active. Focusing or typing in the global search SHALL NOT by itself change which section link is active; active styling SHALL depend only on the current route.

#### Scenario: Clients nav is active on clients page

- **WHEN** authenticated user is on `/clients`
- **THEN** the Clients header link uses the active styling
- **AND** other section links use inactive styling

#### Scenario: Jobs nav is active on jobs page

- **WHEN** authenticated user is on `/jobs`
- **THEN** the Jobs header link uses the active styling
- **AND** other section links use inactive styling

#### Scenario: Transactions nav is active on transactions page

- **WHEN** authenticated user is on `/transactions`
- **THEN** the Transactions header link uses the active styling

#### Scenario: Expenses nav is active on expenses page

- **WHEN** authenticated user is on `/expenses`
- **THEN** the Expenses header link uses the active styling

#### Scenario: Inventory nav is active on inventory page

- **WHEN** authenticated user is on `/inventory`
- **THEN** the Inventory header link uses the active styling

#### Scenario: Global search visible with active shop

- **WHEN** authenticated user has an active shop
- **AND** the user views a page that shows the primary section navigation in the header
- **THEN** the global entity search control is visible in the header
- **AND** primary section links remain visible

#### Scenario: Global search does not steal active nav styling

- **WHEN** authenticated user is on `/jobs`
- **AND** the user focuses the global search field
- **THEN** the Jobs header link remains the active section link

### Requirement: Breadcrumbs component API

The system SHALL provide a reusable `Breadcrumbs` component that accepts an ordered list of segments. Each segment SHALL have a user-visible `label`. Segments except the last MAY include a `to` path for navigation. The last segment SHALL represent the current page and SHALL be rendered without a link. The component SHALL expose a navigation landmark with an accessible name for screen readers.

#### Scenario: Renders trail with link and current page

- **WHEN** breadcrumbs receive `[{ label: 'Home', to: '/transactions' }, { label: 'Clients' }]`
- **THEN** "Home" is a link to `/transactions`
- **AND** "Clients" is plain text with current page semantics for assistive technology

#### Scenario: Single current page only

- **WHEN** breadcrumbs receive `[{ label: 'Transactions' }]`
- **THEN** only "Transactions" is shown as the current page with no preceding links

### Requirement: Breadcrumbs on main layout pages

The system SHALL show the `Breadcrumbs` component on every page that uses the main authenticated layout with the primary section navigation: Clients, Jobs, Transactions, Expenses, and Inventory. Breadcrumb labels SHALL follow the same language as the rest of the UI (i18n). The system SHALL NOT require breadcrumbs on the login page.

#### Scenario: Clients page shows breadcrumbs

- **WHEN** authenticated user views the Clients page
- **THEN** breadcrumbs are visible above the main page content

#### Scenario: Jobs page shows breadcrumbs

- **WHEN** authenticated user views the Jobs page
- **THEN** breadcrumbs are visible above the main page content

#### Scenario: Transactions page shows breadcrumbs

- **WHEN** authenticated user views the Transactions page
- **THEN** breadcrumbs are visible above the main page content

#### Scenario: Expenses page shows breadcrumbs

- **WHEN** authenticated user views the Expenses page
- **THEN** breadcrumbs are visible above the main page content

#### Scenario: Inventory page shows breadcrumbs

- **WHEN** authenticated user views the Inventory page
- **THEN** breadcrumbs are visible above the main page content

#### Scenario: Login page has no breadcrumbs

- **WHEN** user views the login page
- **THEN** breadcrumbs are not shown
