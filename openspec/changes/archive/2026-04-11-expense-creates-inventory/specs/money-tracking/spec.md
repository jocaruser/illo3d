## MODIFIED Requirements

### Requirement: Inventory data model is defined

The system SHALL support an inventory data model with fields: id (string), expense_id (string, FK to expenses), type (enum: filament, consumable, equipment), name (string), qty_initial (number), qty_current (number), created_at (date).

#### Scenario: Inventory represents a purchased lot

- **WHEN** an inventory record exists
- **THEN** it references the expense that created it via expense_id

#### Scenario: Unit cost is calculated from expense

- **WHEN** unit cost is needed for an inventory item
- **THEN** it is calculated as: expense.amount / inventory.qty_initial

#### Scenario: Inventory type includes equipment

- **WHEN** an inventory record has type "equipment"
- **THEN** it represents a physical asset such as a printer or enclosure

### Requirement: Expense data model is defined

The system SHALL support an expenses data model with fields: id (string), date (date), category (enum: filament, consumable, electric, investment, maintenance, other), amount (number), notes (string, optional).

#### Scenario: Expense optionally creates inventory

- **WHEN** an expense is created
- **AND** the user opts in to creating an inventory record
- **THEN** a corresponding inventory record is created with the user-specified type, name, and quantity

#### Scenario: Expense without inventory opt-in

- **WHEN** an expense is created
- **AND** the user does not opt in to creating an inventory record
- **THEN** no inventory record is created

#### Scenario: Expense creates transaction

- **WHEN** any expense is created
- **THEN** a transaction record is created with type "expense" and negative amount

### Requirement: CreateExpensePopup is a reusable modal form

The system SHALL provide a CreateExpensePopup component that renders a modal with a form. The form SHALL collect: date (YYYY-MM-DD), category (enum: filament, consumable, electric, investment, maintenance, other), amount (number), notes (optional). The form SHALL include an "Add to inventory" toggle. When the toggle is checked, the form SHALL additionally collect: inventory type (enum: filament, consumable, equipment), inventory name (prefilled from notes, editable), and quantity (number, > 0). The popup SHALL be closable and usable from multiple pages.

#### Scenario: Popup opens and shows form fields

- **WHEN** user triggers the popup (e.g. clicks "Add expense")
- **THEN** modal displays with date, category, amount, notes inputs
- **AND** category is a select with the six options
- **AND** an "Add to inventory" toggle is visible and unchecked by default

#### Scenario: Inventory fields shown when toggle is checked

- **WHEN** user checks the "Add to inventory" toggle
- **THEN** inventory type, name, and quantity fields appear
- **AND** inventory type is a select with filament, consumable, equipment options
- **AND** inventory name is prefilled with the current notes value
- **AND** quantity defaults to 1

#### Scenario: Inventory fields hidden when toggle is unchecked

- **WHEN** the "Add to inventory" toggle is unchecked
- **THEN** inventory type, name, and quantity fields are not visible

#### Scenario: Quantity hint reflects inventory type

- **WHEN** user selects inventory type "filament"
- **THEN** quantity field shows hint "(g)"
- **WHEN** user selects inventory type "consumable" or "equipment"
- **THEN** quantity field shows hint "(units)"

#### Scenario: Popup can be closed without submitting

- **WHEN** user opens the popup
- **THEN** user can close it via overlay click or close button
- **AND** no expense is created

### Requirement: Form validation before submit

The system SHALL validate the expense form before submission. Date SHALL be required and in YYYY-MM-DD format. Category SHALL be required. Amount SHALL be required and MUST be greater than zero. Notes MAY be empty. When the "Add to inventory" toggle is checked: inventory type SHALL be required, inventory name SHALL be required, and quantity SHALL be required and MUST be greater than zero.

#### Scenario: Validation rejects empty required fields

- **WHEN** user submits with missing date, category, or amount
- **THEN** validation errors are shown
- **AND** no API call is made

#### Scenario: Validation rejects zero or negative amount

- **WHEN** user submits with amount <= 0
- **THEN** validation error is shown for amount
- **AND** no expense is created

#### Scenario: Validation rejects invalid inventory fields when toggle is checked

- **WHEN** user submits with "Add to inventory" checked
- **AND** inventory name is empty or quantity is <= 0
- **THEN** validation errors are shown for the invalid inventory fields
- **AND** no expense is created

#### Scenario: Inventory fields not validated when toggle is unchecked

- **WHEN** user submits with "Add to inventory" unchecked
- **THEN** inventory fields are not validated
- **AND** expense is created normally

### Requirement: Expense creation UI strings support i18n

All user-facing strings in the expense creation flow (form labels, buttons, validation messages, inventory toggle, inventory fields, quantity hints) SHALL use i18next for translation support.

#### Scenario: Form labels are translatable

- **WHEN** CreateExpensePopup renders
- **THEN** field labels and buttons come from i18n keys

#### Scenario: Inventory section labels are translatable

- **WHEN** "Add to inventory" toggle is checked
- **THEN** toggle label, inventory type label, inventory name label, quantity label, and quantity hints come from i18n keys
