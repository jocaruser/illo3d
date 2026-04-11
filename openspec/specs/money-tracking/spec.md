# money-tracking Specification

## Purpose

Financial tracking for illo3d: transactions presentation, clients page (list and create), domain data models (clients, jobs, pieces, piece_items, inventory, expenses, transactions), automated transaction flows, suggested pricing, and expense creation via the UI.

## Requirements

### Requirement: Transactions table is displayed

The system SHALL display a table of all transactions from the transactions sheet. The table SHALL show: date, type (income/expense), amount, category, concept, client name (if applicable).

#### Scenario: Transactions table renders with data

- **WHEN** user navigates to transactions view
- **THEN** table displays all transactions sorted by date descending

#### Scenario: Empty state shown when no transactions

- **WHEN** user navigates to transactions view
- **AND** no transactions exist
- **THEN** table shows empty state message

### Requirement: Transactions table is read-only

The system SHALL NOT allow editing, adding, or deleting transactions directly from the transactions table UI. The transactions table SHALL have no add, edit, or delete controls. Expense-type transactions SHALL be created via the expense creation form; income-type transactions SHALL be created when a job status changes to "paid" or by other automated flows. Manual edits to transactions MAY be done directly in Google Sheets.

#### Scenario: No edit controls in UI

- **WHEN** user views transactions table
- **THEN** no add, edit, or delete buttons are visible on the table itself

#### Scenario: Expense transactions created via expense form

- **WHEN** user creates an expense via CreateExpensePopup
- **THEN** a transaction record is created automatically with type "expense"
- **AND** the transactions table displays it (read-only)

### Requirement: Transaction amounts use correct sign convention

The system SHALL display income as positive amounts and expenses as negative amounts. The amount column SHALL be formatted with currency symbol (€).

#### Scenario: Income shown as positive

- **WHEN** transaction has type "income"
- **THEN** amount is displayed as positive (e.g., €45.00)

#### Scenario: Expense shown as negative

- **WHEN** transaction has type "expense"
- **THEN** amount is displayed as negative (e.g., -€25.00)

### Requirement: Balance is calculated and displayed

The system SHALL calculate the total balance (sum of all transaction amounts) and display it below/above the transactions table.

#### Scenario: Balance reflects all transactions

- **WHEN** user views transactions
- **THEN** balance shows sum of all amounts (income - expenses)

### Requirement: Client data model is defined

The system SHALL support a clients data model with fields: id (string), name (string), email (string, optional), phone (string, optional), notes (string, optional), created_at (date).

#### Scenario: Client has required fields

- **WHEN** a client record exists
- **THEN** it has id and name fields populated

### Requirement: Clients page is accessible from the app

The system SHALL include a `/clients` route protected by the same authentication guard as `/transactions` and `/expenses`. The route SHALL be listed in the app header navigation.

#### Scenario: Clients route is protected

- **WHEN** an unauthenticated user navigates to `/clients`
- **THEN** the system redirects to `/login`

#### Scenario: Authenticated user accesses clients page

- **WHEN** an authenticated user navigates to `/clients`
- **THEN** the clients page renders without redirection

### Requirement: Job data model is defined

The system SHALL support a jobs data model with fields: id (string), client_id (string, FK to clients), description (string), status (enum: draft, in_progress, delivered, paid, cancelled), price (number, optional), created_at (date).

#### Scenario: Job linked to client

- **WHEN** a job record exists
- **THEN** it has valid client_id referencing an existing client

#### Scenario: Job status transitions

- **WHEN** job status changes to "paid"
- **THEN** a transaction record is created automatically

### Requirement: Piece data model is defined

The system SHALL support a pieces data model with fields: id (string), job_id (string, FK to jobs), name (string), status (enum: pending, done, failed), created_at (date).

#### Scenario: Piece linked to job

- **WHEN** a piece record exists
- **THEN** it has valid job_id referencing an existing job

#### Scenario: Piece completion triggers inventory consumption

- **WHEN** piece status changes to "done" or "failed"
- **THEN** inventory qty_current is decremented for all piece_items of that piece

### Requirement: Piece_items data model is defined

The system SHALL support a piece_items data model with fields: id (string), piece_id (string, FK to pieces), inventory_id (string, FK to inventory), quantity (number).

#### Scenario: Piece_item links piece to inventory

- **WHEN** a piece_item record exists
- **THEN** it connects a piece to an inventory lote with a quantity consumed

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

### Requirement: Transaction data model is defined

The system SHALL support a transactions data model with fields: id (string), date (date), type (enum: income, expense), amount (number), category (string), concept (string), ref_type (enum: job, expense), ref_id (string), client_id (string, optional), notes (string, optional).

#### Scenario: Transaction references its source

- **WHEN** a transaction record exists
- **THEN** ref_type and ref_id identify whether it came from a job or expense

### Requirement: Job price is suggested based on materials

The system SHALL calculate a suggested price for a job as: sum of (piece_item.quantity × inventory.unit_cost) for all pieces with status "done" or "failed", multiplied by 3.

#### Scenario: Price suggestion calculated

- **WHEN** job has pieces with piece_items
- **THEN** suggested price = total material cost × 3

#### Scenario: Price can be overridden

- **WHEN** user sets a custom price for a job
- **THEN** the custom price is used instead of the suggested price

### Requirement: Paying a job creates income transaction

The system SHALL automatically create a transaction when a job status changes to "paid". The transaction SHALL have type "income", the job's price as amount, and reference the job.

#### Scenario: Job payment creates transaction

- **WHEN** job.status changes to "paid"
- **THEN** transaction is created with:
  - type: "income"
  - amount: job.price
  - category: "job"
  - concept: job.description
  - ref_type: "job"
  - ref_id: job.id
  - client_id: job.client_id

### Requirement: Expenses page displays expense table

The system SHALL provide an `/expenses` route that displays a table of all expenses from the expenses sheet. The table SHALL show: date, category, amount, notes. The expenses page SHALL additionally fetch inventory data and display a link on expense rows that have an associated inventory item. The link SHALL navigate to `/inventory`.

#### Scenario: Expenses table renders with data

- **WHEN** user navigates to /expenses
- **THEN** table displays all expenses sorted by date descending

#### Scenario: Empty state when no expenses

- **WHEN** user navigates to /expenses
- **AND** no expenses exist
- **THEN** table shows empty state message

#### Scenario: Expense with linked inventory shows link

- **WHEN** user views /expenses
- **AND** an expense has a corresponding inventory item (matched via inventory.expense_id)
- **THEN** the expense row displays a text link navigating to /inventory

#### Scenario: Expense without linked inventory shows no link

- **WHEN** user views /expenses
- **AND** an expense has no corresponding inventory item
- **THEN** the expense row does not display an inventory link

#### Scenario: Inventory data is fetched on expenses page

- **WHEN** user navigates to /expenses
- **THEN** both expenses and inventory data are fetched
- **AND** a mapping from expense_id to inventory id is built from the inventory data

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

### Requirement: Add expense button on transactions and expenses pages

The system SHALL display an "Add expense" button on the /transactions page and on the /expenses page. Clicking the button SHALL open the CreateExpensePopup.

#### Scenario: Button on transactions page

- **WHEN** user views /transactions
- **THEN** "Add expense" button is visible
- **AND** clicking it opens CreateExpensePopup

#### Scenario: Button on expenses page

- **WHEN** user views /expenses
- **THEN** "Add expense" button is visible
- **AND** clicking it opens CreateExpensePopup

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

### Requirement: Successful submit redirects to expenses

The system SHALL redirect the user to /expenses after a successful expense creation. The popup SHALL close and the new expense SHALL appear in the expenses table.

#### Scenario: Redirect after success

- **WHEN** user submits valid expense form
- **AND** creation succeeds
- **THEN** popup closes
- **AND** user is navigated to /expenses
- **AND** the new expense appears in the table

### Requirement: UI strings support i18n

All user-facing strings in the transactions view SHALL use i18next for translation support.

#### Scenario: Table headers are translatable

- **WHEN** transactions table renders
- **THEN** column headers come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown
- **THEN** message comes from i18n keys

### Requirement: Expense creation UI strings support i18n

All user-facing strings in the expense creation flow (form labels, buttons, validation messages, table headers, inventory toggle, inventory fields, quantity hints) SHALL use i18next for translation support.

#### Scenario: Form labels are translatable

- **WHEN** CreateExpensePopup renders
- **THEN** field labels and buttons come from i18n keys

#### Scenario: Inventory section labels are translatable

- **WHEN** "Add to inventory" toggle is checked
- **THEN** toggle label, inventory type label, inventory name label, quantity label, and quantity hints come from i18n keys
