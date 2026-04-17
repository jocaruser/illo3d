# inventory-display Specification

## Purpose

Read-only inventory view: `/inventory` route, table backed by the workbook store after hydration, header navigation, average unit cost from lots, configurable low-stock thresholds, localized UI strings (English and Spanish), and no edit controls in the inventory UI.

## Requirements

### Requirement: Inventory page displays inventory table

The system SHALL provide an `/inventory` route protected by the same authentication guard as other data pages. The route SHALL display a table of all inventory items from the inventory sheet. The table SHALL show: name, type (localized), current quantity, average unit cost (computed from lots), and created date. The average unit cost column SHALL display `Σ(lot.amount) / Σ(lot.quantity)` for active lots of that inventory item, formatted with currency symbol (€). When no active lots exist, the cost column SHALL show a placeholder (e.g. em dash).

#### Scenario: Inventory table renders with data

- **WHEN** user navigates to /inventory
- **THEN** table displays all inventory items sorted by created_at descending
- **AND** each row shows name, type, qty_current, avg unit cost, and created_at

#### Scenario: Empty state when no inventory

- **WHEN** user navigates to /inventory
- **AND** no inventory items exist
- **THEN** page shows an empty state message

#### Scenario: Inventory route is protected

- **WHEN** an unauthenticated user navigates to `/inventory`
- **THEN** the system redirects to `/login`

#### Scenario: Average unit cost shown per item

- **WHEN** an inventory item has lots with amounts [29.99, 18.99] and quantities [1000, 500]
- **THEN** the avg unit cost column shows €0.03 (or formatted equivalent)

#### Scenario: No lots shows placeholder cost

- **WHEN** an inventory item has no active lots
- **THEN** the avg unit cost column shows "—"

### Requirement: Inventory page is accessible from app navigation

The system SHALL include an "Inventory" link in the app header navigation, alongside the existing Clients, Jobs, and Transactions links.

#### Scenario: Inventory link in header

- **WHEN** user views any page with the app header
- **THEN** an "Inventory" link is visible in the navigation
- **AND** clicking it navigates to `/inventory`

### Requirement: Inventory table is read-only

The system SHALL NOT allow editing, adding, or deleting inventory items from the inventory table UI. The inventory table SHALL have no add, edit, or delete controls.

#### Scenario: No edit controls in inventory UI

- **WHEN** user views inventory table
- **THEN** no add, edit, or delete buttons are visible

### Requirement: Inventory low-stock warnings use configurable thresholds

The system SHALL highlight inventory rows based on configurable per-item thresholds instead of hardcoded ratios. When `qty_current <= warn_red` and `warn_red > 0`, the row SHALL use a critical highlight (red). When `qty_current <= warn_orange` and `warn_orange > 0`, the row SHALL use a low highlight (orange). When `qty_current <= warn_yellow` and `warn_yellow > 0`, the row SHALL use a caution highlight (yellow). When all thresholds are 0 or qty_current is above all thresholds, no highlight SHALL be applied.

#### Scenario: Critical stock level

- **WHEN** an inventory item has qty_current=30 and warn_red=50
- **THEN** the row is highlighted red

#### Scenario: Low stock level

- **WHEN** an inventory item has qty_current=120, warn_orange=150, warn_red=50
- **THEN** the row is highlighted orange

#### Scenario: Caution stock level

- **WHEN** an inventory item has qty_current=250, warn_yellow=300, warn_orange=150, warn_red=50
- **THEN** the row is highlighted yellow

#### Scenario: No highlight when thresholds are zero

- **WHEN** an inventory item has warn_yellow=0, warn_orange=0, warn_red=0
- **THEN** no highlight is applied regardless of qty_current

#### Scenario: No highlight when above all thresholds

- **WHEN** an inventory item has qty_current=500, warn_yellow=300, warn_orange=150, warn_red=50
- **THEN** no highlight is applied

### Requirement: Inventory type is displayed with localized label

The system SHALL display inventory type values (filament, consumable, equipment) using localized i18n strings.

#### Scenario: Type column shows localized text

- **WHEN** inventory table renders an item with type "filament"
- **THEN** the type cell displays the localized label for filament

#### Scenario: All inventory types are localized

- **WHEN** inventory table renders items
- **THEN** filament, consumable, and equipment types each display their respective localized label

### Requirement: Inventory data is fetched via workbook hydration

The system SHALL parse inventory data from the workbook store via `matrixToInventory`. Numeric fields `qty_current`, `warn_yellow`, `warn_orange`, and `warn_red` SHALL be parsed as numbers (defaulting to 0 for empty/missing values).

#### Scenario: Inventory data loads from workbook store

- **WHEN** the inventory page mounts with a hydrated workbook
- **THEN** inventory data is available from `useWorkbookEntities().inventory`

#### Scenario: Numeric fields are parsed correctly

- **WHEN** inventory data is parsed
- **THEN** qty_current, warn_yellow, warn_orange, and warn_red are numbers

#### Scenario: Missing threshold values default to zero

- **WHEN** an inventory row has empty warn_yellow, warn_orange, or warn_red
- **THEN** the parsed values default to 0

### Requirement: Inventory UI strings support i18n

All user-facing strings in the inventory page (page title, table headers, empty state, type labels, cost column header) SHALL use i18next for translation support in both English and Spanish.

#### Scenario: Table headers are translatable

- **WHEN** inventory table renders
- **THEN** column headers (including avg unit cost) come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown
- **THEN** message comes from i18n keys
