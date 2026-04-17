# purchase-recording Specification

## Purpose

Recording purchases from the transactions page: CreatePurchasePopup, optional inventory line items, linked lot rows, validation, and i18n.

## Requirements

### Requirement: Record purchase button on transactions page

The system SHALL display a "Record purchase" button on the `/transactions` page. Clicking the button SHALL open the CreatePurchasePopup. The button label SHALL use i18n keys.

#### Scenario: Button visible on transactions page

- **WHEN** user views `/transactions` with workbook ready
- **THEN** a "Record purchase" button is visible
- **AND** clicking it opens CreatePurchasePopup

### Requirement: CreatePurchasePopup is a reusable modal form

The system SHALL provide a CreatePurchasePopup component that renders a modal with a form. The form SHALL collect: date (YYYY-MM-DD), category (enum: filament, consumable, equipment, electric, maintenance, other), amount (number, > 0), and notes (optional). The form SHALL include an "Add to inventory" toggle, unchecked by default.

#### Scenario: Popup opens with base fields

- **WHEN** user triggers the popup (e.g. clicks "Record purchase")
- **THEN** modal displays with date, category, amount, notes inputs
- **AND** category is a select with six options (filament, consumable, equipment, electric, maintenance, other)
- **AND** an "Add to inventory" toggle is visible and unchecked by default

#### Scenario: Popup can be closed without submitting

- **WHEN** user opens the popup
- **THEN** user can close it via overlay click or close button
- **AND** no transaction is created

### Requirement: Inventory line items when toggle is checked

When the "Add to inventory" toggle is checked, the form SHALL display a line-item section. Each line item SHALL collect: inventory item (select existing or create new), quantity (number, > 0), and amount (number, > 0, the cost of this lot). The form SHALL allow adding multiple line items via an "+ Add another item" control. When creating a new inventory item inline, the form SHALL collect: name (required), type (filament | consumable | equipment). The transaction amount field SHALL be automatically calculated as the sum of all line item amounts when line items are present.

#### Scenario: Inventory fields shown when toggle is checked

- **WHEN** user checks the "Add to inventory" toggle
- **THEN** a line-item section appears with one default line
- **AND** each line has inventory item selector, quantity, and amount fields
- **AND** an "+ Add another item" button is visible

#### Scenario: Inventory fields hidden when toggle is unchecked

- **WHEN** the "Add to inventory" toggle is unchecked
- **THEN** the line-item section is not visible

#### Scenario: Selecting existing inventory item

- **WHEN** user clicks the inventory item selector on a line
- **THEN** a dropdown lists all active (non-archived, non-deleted) inventory items by name
- **AND** selecting one populates the line with that inventory item

#### Scenario: Creating new inventory item inline

- **WHEN** user selects "+ New" in the inventory item selector
- **THEN** name and type inputs appear for that line
- **AND** type is a select with filament, consumable, equipment options

#### Scenario: Multiple line items

- **WHEN** user clicks "+ Add another item"
- **THEN** a new empty line item is added to the section

#### Scenario: Transaction amount auto-calculated from line items

- **WHEN** "Add to inventory" is checked and line items have amounts
- **THEN** the transaction amount field displays the sum of all line item amounts
- **AND** the amount field is read-only (derived from line items)

#### Scenario: Quantity hint reflects inventory type

- **WHEN** a line item references an inventory item of type "filament"
- **THEN** quantity field shows hint "(g)"
- **WHEN** a line item references an inventory item of type "consumable" or "equipment"
- **THEN** quantity field shows hint "(units)"

### Requirement: Purchase form validation

The system SHALL validate the purchase form before submission. Date SHALL be required and in YYYY-MM-DD format. Category SHALL be required. When "Add to inventory" is unchecked: amount SHALL be required and > 0, notes SHALL be optional. When "Add to inventory" is checked: each line item SHALL have a valid inventory item (existing or new with name and type), quantity > 0, and amount > 0. At least one line item SHALL be present.

#### Scenario: Validation rejects empty required fields

- **WHEN** user submits with missing date or category
- **THEN** validation errors are shown
- **AND** no transaction is created

#### Scenario: Validation rejects zero or negative amount without inventory

- **WHEN** "Add to inventory" is unchecked and user submits with amount <= 0
- **THEN** validation error is shown for amount

#### Scenario: Validation rejects incomplete line items

- **WHEN** "Add to inventory" is checked and a line item has missing inventory item, quantity <= 0, or amount <= 0
- **THEN** validation errors are shown for the invalid line item fields

#### Scenario: Validation rejects no line items when toggle is on

- **WHEN** "Add to inventory" is checked and all line items have been removed
- **THEN** validation error indicates at least one line item is required

### Requirement: Successful purchase creates transaction and optional lots

When the form is submitted with "Add to inventory" unchecked, the system SHALL create one transaction row with type `expense`, negative amount, the selected category, concept derived from notes or category, empty ref_type and ref_id, and empty client_id.

When the form is submitted with "Add to inventory" checked, the system SHALL: create one transaction row as above (amount = negative sum of lot amounts), create one lot row per line item (with inventory_id, transaction_id, quantity, amount, created_at), create new inventory items for any "+ New" line items (with type, name, qty_current = lot quantity, thresholds defaulting to 0, created_at), and increment qty_current on existing inventory items by the lot quantity.

#### Scenario: Overhead purchase (no inventory)

- **WHEN** user submits with "Add to inventory" unchecked, date "2026-04-16", category "electric", amount 45, notes "April bill"
- **THEN** one transaction row is created: type=expense, amount=-45, category=electric, concept="April bill"
- **AND** no lots or inventory items are created

#### Scenario: Single-item purchase with existing inventory

- **WHEN** user submits with "Add to inventory" checked, one line item referencing existing inventory "PLA White" (INV1), quantity=1000, amount=29.99
- **THEN** one transaction row is created: type=expense, amount=-29.99, category matching INV1 type
- **AND** one lot row is created: inventory_id=INV1, transaction_id=new txn id, quantity=1000, amount=29.99
- **AND** INV1.qty_current is incremented by 1000

#### Scenario: Multi-item purchase with new inventory

- **WHEN** user submits with "Add to inventory" checked, two line items: existing "PLA White" qty=500 amount=15, new item "Nozzle Set" type=consumable qty=5 amount=8.50
- **THEN** one transaction row is created: amount=-23.50
- **AND** two lot rows are created, each referencing the correct inventory_id and the same transaction_id
- **AND** a new inventory item "Nozzle Set" is created with type=consumable, qty_current=5
- **AND** PLA White qty_current is incremented by 500

### Requirement: Successful purchase closes popup

The system SHALL close the CreatePurchasePopup after a successful purchase submission. The transactions list SHALL reflect the new transaction.

#### Scenario: Popup closes after success

- **WHEN** user submits a valid purchase form
- **AND** creation succeeds
- **THEN** popup closes
- **AND** the new transaction appears in the transactions table

### Requirement: Purchase recording UI strings support i18n

All user-facing strings in the purchase recording flow (form labels, buttons, validation messages, toggle label, line item labels, quantity hints, inventory selector) SHALL use i18next for translation support in both English and Spanish.

#### Scenario: Form labels are translatable

- **WHEN** CreatePurchasePopup renders
- **THEN** all field labels, buttons, and messages come from i18n keys

#### Scenario: Line item labels are translatable

- **WHEN** "Add to inventory" is checked
- **THEN** line item labels, add button, and new-item fields use i18n keys
