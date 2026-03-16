# money-tracking Specification

## Purpose

Sistema de seguimiento financiero. Modelo de datos (clients, jobs, pieces, piece_items, inventory, expenses, transactions), flujos automáticos de creación de transacciones, cálculo de precios.

## ADDED Requirements

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

The system SHALL support an inventory data model with fields: id (string), expense_id (string, FK to expenses), type (enum: filament, consumable), name (string), qty_initial (number), qty_current (number), created_at (date).

#### Scenario: Inventory represents a purchased lot
- **WHEN** an inventory record exists
- **THEN** it references the expense that created it via expense_id

#### Scenario: Unit cost is calculated from expense
- **WHEN** unit cost is needed for an inventory item
- **THEN** it is calculated as: expense.amount / inventory.qty_initial

### Requirement: Expense data model is defined

The system SHALL support an expenses data model with fields: id (string), date (date), category (enum: filament, consumable, electric, investment, maintenance, other), amount (number), notes (string, optional).

#### Scenario: Material expense creates inventory
- **WHEN** expense with category "filament" or "consumable" is created
- **THEN** a corresponding inventory record is created

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

### Requirement: UI strings support i18n

All user-facing strings in the transactions view SHALL use i18next for translation support.

#### Scenario: Table headers are translatable
- **WHEN** transactions table renders
- **THEN** column headers come from i18n keys

#### Scenario: Empty state message is translatable
- **WHEN** empty state is shown
- **THEN** message comes from i18n keys
