# inventory-display Specification

## Purpose

Read-only inventory view: `/inventory` route, table backed by the inventory sheet, `fetchInventory` / `useInventory` data loading, header navigation, localized UI strings (English and Spanish), and no edit controls in the inventory UI.

## Requirements

### Requirement: Inventory page displays inventory table

The system SHALL provide an `/inventory` route protected by the same authentication guard as other data pages. The route SHALL display a table of all inventory items from the inventory sheet. The table SHALL show: name, type (localized), initial quantity, current quantity, and created date.

#### Scenario: Inventory table renders with data

- **WHEN** user navigates to /inventory
- **THEN** table displays all inventory items sorted by created_at descending

#### Scenario: Empty state when no inventory

- **WHEN** user navigates to /inventory
- **AND** no inventory items exist
- **THEN** page shows an empty state message

#### Scenario: Inventory route is protected

- **WHEN** an unauthenticated user navigates to `/inventory`
- **THEN** the system redirects to `/login`

### Requirement: Inventory page is accessible from app navigation

The system SHALL include an "Inventory" link in the app header navigation, alongside the existing Clients, Transactions, and Expenses links.

#### Scenario: Inventory link in header

- **WHEN** user views any page with the app header
- **THEN** an "Inventory" link is visible in the navigation
- **AND** clicking it navigates to `/inventory`

### Requirement: Inventory table is read-only

The system SHALL NOT allow editing, adding, or deleting inventory items from the inventory table UI. The inventory table SHALL have no add, edit, or delete controls.

#### Scenario: No edit controls in inventory UI

- **WHEN** user views inventory table
- **THEN** no add, edit, or delete buttons are visible

### Requirement: Inventory type is displayed with localized label

The system SHALL display inventory type values (filament, consumable, equipment) using localized i18n strings.

#### Scenario: Type column shows localized text

- **WHEN** inventory table renders an item with type "filament"
- **THEN** the type cell displays the localized label for filament

#### Scenario: All inventory types are localized

- **WHEN** inventory table renders items
- **THEN** filament, consumable, and equipment types each display their respective localized label

### Requirement: Inventory data is fetched via sheets service

The system SHALL provide a `fetchInventory` service function and a `useInventory` hook following the same pattern as `fetchExpenses`/`useExpenses`. The hook SHALL use TanStack Query with key `['inventory', spreadsheetId]`.

#### Scenario: Inventory data loads from sheet

- **WHEN** the inventory page mounts with a valid spreadsheet connection
- **THEN** inventory data is fetched from the inventory sheet

#### Scenario: Numeric fields are parsed correctly

- **WHEN** inventory data is fetched
- **THEN** qty_initial and qty_current are parsed as numbers

### Requirement: Inventory UI strings support i18n

All user-facing strings in the inventory page (page title, table headers, empty state, type labels) SHALL use i18next for translation support in both English and Spanish.

#### Scenario: Table headers are translatable

- **WHEN** inventory table renders
- **THEN** column headers come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown
- **THEN** message comes from i18n keys
