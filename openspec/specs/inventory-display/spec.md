# inventory-display Specification

## Purpose

Inventory **list** on `/inventory`: table backed by the workbook store after hydration, header navigation, average unit cost from lots, configurable low-stock thresholds, localized UI strings (English and Spanish), and no edit controls in the list UI. Inventory **detail** on `/inventory/:inventoryId`: item header, editable low-stock thresholds, purchase lots linked to transactions, and consumption derived from piece items; localized UI strings.

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

The system SHALL NOT allow editing, adding, or deleting inventory items from the **inventory list** table on `/inventory`. The inventory **list** table SHALL have no add, edit, or delete controls. Editing of `warn_yellow`, `warn_orange`, and `warn_red` SHALL be available only on the **inventory detail** page as specified in the inventory detail requirement.

#### Scenario: No edit controls in inventory list UI

- **WHEN** user views the inventory list table on `/inventory`
- **THEN** no add, edit, or delete buttons are visible for rows

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

All user-facing strings on the **inventory list** page and the **inventory detail** page (page titles, table headers, empty states, type labels, cost column header, section titles for lots and consumption, not-found copy, threshold labels, and save/validation feedback for threshold edits) SHALL use i18next for translation support in both English and Spanish.

#### Scenario: Table headers are translatable

- **WHEN** inventory list table renders
- **THEN** column headers (including avg unit cost) come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown on the inventory list
- **THEN** message comes from i18n keys

#### Scenario: Detail page strings are translatable

- **WHEN** user views inventory detail for a valid item
- **THEN** all new user-visible labels and messages on that page come from i18n keys

### Requirement: Inventory detail route and access control

The system SHALL provide a protected route `/inventory/:inventoryId`. When the sheet connection is **connected** and no inventory row matches `inventoryId` (among non-deleted, non-archived items as defined for the list), the system SHALL show a not-found message with a link back to `/inventory`. Unauthenticated users SHALL be redirected to `/login`.

#### Scenario: Detail renders for valid id

- **WHEN** an authenticated user navigates to `/inventory/INV1`
- **AND** INV1 exists as an active inventory row
- **THEN** the inventory detail page renders

#### Scenario: Unknown id shows not-found

- **WHEN** an authenticated user navigates to `/inventory/UNKNOWN`
- **AND** the workbook is connected
- **AND** no active inventory row has id UNKNOWN
- **THEN** the user sees a not-found message
- **AND** a control or link is available to navigate to `/inventory`

### Requirement: Inventory list navigates to inventory detail

The system SHALL provide navigation from each inventory list row to `/inventory/:inventoryId` for that row’s id. The interaction SHALL be keyboard accessible (e.g. link or button semantics).

#### Scenario: User opens detail from list

- **WHEN** user activates the navigation affordance for a row on `/inventory`
- **THEN** the app navigates to `/inventory/:inventoryId` for that item

### Requirement: Inventory detail header and threshold editing

The inventory detail page SHALL display the item **name**, **type** (localized), **`qty_current`**, and **average unit cost** using the same weighted average rule as the inventory list for active lots. The page SHALL allow the user to edit **`warn_yellow`**, **`warn_orange`**, and **`warn_red`** and persist changes to the inventory sheet. The list page SHALL remain read-only for these fields.

#### Scenario: Header shows identity and cost

- **WHEN** user views inventory detail for an item with known lots
- **THEN** name, localized type, qty_current, and avg unit cost are visible
- **AND** avg unit cost matches the list formula for active lots

#### Scenario: User updates thresholds

- **WHEN** user changes threshold fields on inventory detail and commits (save or equivalent pattern used elsewhere)
- **THEN** the workbook stores updated warn_yellow, warn_orange, and warn_red for that inventory id
- **AND** subsequent list and detail views reflect the new values

### Requirement: Inventory detail lots section

The inventory detail page SHALL show a table (or equivalent) of **active** lots for that `inventory_id`, including **created date**, **quantity**, **amount** (cost), and a **link or navigation** to the related **transaction**. Lots excluded from average unit cost (archived/deleted) SHALL be excluded from this table. Lots SHALL be ordered by `created_at` descending.

#### Scenario: Lots render with transaction link

- **WHEN** an item has at least one active lot with a valid `transaction_id`
- **THEN** the lots section lists that lot with date, quantity, amount, and an affordance to open the linked transaction context

#### Scenario: No lots

- **WHEN** an item has no active lots
- **THEN** the lots section does not imply purchases exist (simple empty presentation consistent with the single empty pattern requirement)

### Requirement: Inventory detail consumption section

The inventory detail page SHALL show consumption rows derived from **`piece_items`** that reference this `inventory_id`, joined to **piece** and **job** entities when available. Each row SHALL show **quantity consumed** and as much **identifying context** as the data model provides (e.g. piece id or label, job id or description). Rows SHALL include **links** to `/jobs/:jobId` when the job exists. **Timestamps** SHALL be shown when present on the underlying records.

#### Scenario: Consumption shows job link

- **WHEN** a piece_item references this inventory and resolves to a piece with a job_id
- **THEN** the consumption section shows a row with quantity consumed
- **AND** the user can navigate to the job detail route for that job

### Requirement: Inventory detail simple empty pattern

When an inventory item has **no active lots** and **no consumption rows**, the detail page SHALL use a **single** minimal empty presentation (e.g. one `EmptyState` or one short message) rather than multiple independent empty flows.

#### Scenario: No lots and no consumption

- **WHEN** the item has no active lots and no matching piece_items
- **THEN** the user sees one consolidated empty message for the lower sections
