# data-view-presentation Specification

## Purpose

Normative UX for authenticated **data list** views: recover from unexpected render errors without a blank screen, show consistent loading feedback while list queries are in flight, and show consistent empty states when lists have no rows—without changing how data is fetched or stored.

## Requirements

### Requirement: Protected route content uses a React error boundary

The system SHALL wrap the rendered children of `ProtectedRoute` (the authenticated page body) in a React error boundary. If a descendant component throws during render, the boundary SHALL display a user-visible fallback with a short explanation and a control to retry. All user-visible strings in the fallback SHALL come from i18n (`en` and `es`). The login route SHALL NOT be wrapped by this boundary if that would prevent users from signing in when another part of the app fails.

#### Scenario: Render error shows fallback with retry

- **WHEN** an authenticated page throws an error during render
- **THEN** the user sees a non-empty fallback panel instead of a white screen
- **AND** the panel includes a retry affordance that attempts to restore the page

#### Scenario: Fallback is localized

- **WHEN** the UI language is Spanish
- **THEN** the error boundary fallback text uses Spanish strings from the translation resources

### Requirement: In-scope data pages use a shared loading indicator

On the Clients, Transactions, Expenses, and Inventory pages, while the primary list query for that page reports loading (`isLoading` true) and the sheet connection is in the connected state, the system SHALL show a shared loading component (e.g. `LoadingSpinner`) with accessible busy semantics and an i18n label. Ad hoc plain-text “Loading...” paragraphs SHALL NOT be used on those pages.

#### Scenario: Clients page shows shared loading

- **WHEN** the clients list query is loading and the connection is connected
- **THEN** the shared loading component is visible in the main content area

#### Scenario: Inventory page shows shared loading

- **WHEN** the inventory list query is loading and the connection is connected
- **THEN** the shared loading component is visible in the main content area

### Requirement: In-scope data pages use shared empty state

On the Clients, Transactions, Expenses, and Inventory pages, when the primary list is empty (length zero), not loading, and the sheet connection is connected, the system SHALL render the shared `EmptyState` component with the appropriate message key for that page (e.g. clients, transactions, expenses, inventory empty strings). Duplicated one-off empty markup SHALL NOT be used on those pages for that purpose.

#### Scenario: Expenses empty uses EmptyState

- **WHEN** the expenses list is empty and loaded
- **THEN** the UI shows `EmptyState` with expenses-specific copy

#### Scenario: Transactions empty uses EmptyState

- **WHEN** the transactions list is empty and loaded
- **THEN** the UI shows `EmptyState` with transactions-specific copy

### Requirement: Scope of shared list presentation

The shared loading and empty-state requirements in this specification apply to the Clients, Transactions, Expenses, and Inventory pages. Other authenticated data pages (e.g. Jobs) MAY use different loading or empty presentation until they are explicitly brought under this specification.

#### Scenario: Normative scope is limited to named pages

- **WHEN** assessing compliance with shared loading and empty-state requirements
- **THEN** only Clients, Transactions, Expenses, and Inventory are required to use the shared components as specified
