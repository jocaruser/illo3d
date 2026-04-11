# money-tracking Specification

## Purpose

Financial tracking for illo3d: transactions presentation, clients page (list, create, edit, and delete), domain data models (clients, jobs, pieces, piece_items, inventory, expenses, transactions), automated transaction flows, suggested pricing, and expense creation, editing, and deletion via the UI.

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

The system SHALL NOT allow editing, adding, or deleting transactions directly from the transactions table UI. The transactions table SHALL have no add, edit, or delete controls. Expense-type transactions SHALL be created via the expense creation form; income-type transactions SHALL be created when a job status changes to "paid" with default income behavior, or by other automated flows (see "Paying a job creates income transaction" for UI opt-out). Manual edits to transactions MAY be done directly in Google Sheets.

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

- **WHEN** job status changes to "paid" with default income-transaction behavior
- **THEN** a transaction record is created automatically (see "Paying a job creates income transaction" for opt-out)

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

### Requirement: Job detail page lists pieces for that job

The system SHALL provide a job detail route `/jobs/:jobId` protected by the same authentication guard as `/jobs`. The system SHALL NOT provide a top-level Pieces tab or `/pieces` route. When the sheet connection is connected, the job detail page SHALL show a summary of the job (description, id, client, status, price, created_at) and a **Pieces** section. The Pieces section SHALL list only pieces whose `job_id` matches `:jobId`, with columns: id, name, status (`pending`, `done`, `failed` with i18n labels), and `created_at` (job reference column omitted on this page). Rows SHALL be sorted by `created_at` descending. When no pieces exist for the job, the Pieces section SHALL show an empty state message using i18n.

#### Scenario: Authenticated user opens job detail with pieces

- **WHEN** an authenticated user with an active shop navigates to `/jobs/J1`
- **AND** the spreadsheet connection succeeds
- **AND** pieces exist for that job
- **THEN** the Pieces section shows those pieces
- **AND** no standalone Pieces navigation entry exists in the app header

#### Scenario: Unauthenticated user cannot open job detail

- **WHEN** an unauthenticated user navigates to `/jobs/J1`
- **THEN** the system redirects to `/login`

### Requirement: fetchPieces and usePieces read pieces sheet

The system SHALL provide `fetchPieces(spreadsheetId)` that reads all rows from the `pieces` sheet via `SheetsRepository`, filters out rows without `id`, parses `status` as a piece status, and returns `Piece` objects sorted by `created_at` descending. The system SHALL provide `usePieces(spreadsheetId)` using TanStack Query with query key `['pieces', spreadsheetId]`, following the same enabled/null pattern as `useJobs`.

#### Scenario: Hooks load when spreadsheet is available

- **WHEN** `usePieces` is used with a non-null spreadsheet id
- **THEN** data is fetched from the pieces sheet through `fetchPieces`

### Requirement: fetchPieceItems and usePieceItems read piece_items sheet

The system SHALL provide `fetchPieceItems(spreadsheetId)` that reads all rows from the `piece_items` sheet, filters rows without `id`, parses `quantity` as a number, and returns `PieceItem` objects. The system SHALL provide `usePieceItems(spreadsheetId)` with query key `['piece_items', spreadsheetId]`, following the same pattern as `usePieces`.

#### Scenario: Piece items available for grouping by piece

- **WHEN** `fetchPieceItems` completes successfully
- **THEN** each returned object includes `piece_id`, `inventory_id`, and numeric `quantity`

### Requirement: Piece rows expand to show piece_items

The system SHALL allow the user to expand a piece row to view a nested list of that piece’s `piece_items`. The nested list SHALL show at least: piece_item id, inventory lot name (resolved from the inventory sheet), and quantity. The nested section SHALL include a control to add a new piece_item to that piece. Collapsing a row SHALL hide its nested list.

#### Scenario: User expands a piece with lines

- **WHEN** the user expands a piece that has piece_items
- **THEN** each related piece_item appears with inventory name and quantity

### Requirement: CreatePiecePopup creates a piece for a selected job

The system SHALL provide `CreatePiecePopup` that collects a required piece name. When opened from a context without a fixed job, the popup SHALL also collect a required job via a searchable list from cached jobs data (same interaction pattern as `CreateJobPopup` client picker). When opened from a job detail page, the job SHALL be fixed to that job and the job picker SHALL NOT be shown. On successful submit, the system SHALL call `createPiece` to append a row with generated `P`-prefixed id, `status` `pending`, and current ISO timestamp for `created_at`. The popup SHALL be closable without saving. All user-visible strings SHALL use i18n (English and Spanish).

#### Scenario: Valid create appends piece row with job picker

- **WHEN** the user selects a job and enters a non-empty name and submits
- **THEN** a new row is appended to the pieces sheet
- **AND** the pieces list refreshes to include the new piece

#### Scenario: Valid create from job detail uses fixed job

- **WHEN** the user opens CreatePiecePopup from a job detail page and enters a non-empty name and submits
- **THEN** a new row is appended with that job’s id as `job_id`

#### Scenario: Missing job or name shows validation

- **WHEN** the user submits without a selected job (when the picker is shown) or with an empty name
- **THEN** validation errors are shown
- **AND** no row is appended

### Requirement: createPiece service appends pieces

The system SHALL provide `createPiece(spreadsheetId, { job_id, name })` that generates the next `P`-prefixed id from existing piece ids, and appends one row to the `pieces` sheet with `status` `pending` and `created_at` set to the current time in ISO-8601 format.

#### Scenario: Id increments after existing pieces

- **WHEN** pieces `P1` and `P2` already exist
- **AND** `createPiece` is invoked
- **THEN** the appended row has id `P3`

### Requirement: CreatePieceItemPopup allocates inventory to a piece

The system SHALL provide `CreatePieceItemPopup` that collects a required inventory lot (select from cached inventory) and a required quantity greater than zero. On success it SHALL call `createPieceItem` to append a `piece_items` row. The form layout and validation style SHALL follow `CreateExpensePopup` (overlay close, inline field errors, submit/cancel). All user-visible strings SHALL use i18n. Creating a piece_item SHALL NOT modify `inventory.qty_current`.

#### Scenario: Valid line appends piece_item

- **WHEN** the user chooses an inventory lot and enters a positive quantity and submits
- **THEN** a new row is appended to the piece_items sheet for the given piece
- **AND** inventory quantities are unchanged

#### Scenario: Non-positive quantity is rejected

- **WHEN** the user submits quantity zero or negative
- **THEN** a validation error is shown
- **AND** no row is appended

### Requirement: createPieceItem service appends piece_items

The system SHALL provide `createPieceItem(spreadsheetId, { piece_id, inventory_id, quantity })` that generates the next `PI`-prefixed id from existing piece_item ids and appends one row linking the piece, inventory lot, and quantity.

#### Scenario: Id increments after existing piece_items

- **WHEN** piece_items `PI1` and `PI2` already exist
- **AND** `createPieceItem` is invoked
- **THEN** the appended row has id `PI3`

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

The system SHALL create an income transaction when a job status changes to "paid" **by default**, via the `updateJobStatus` service when income creation is not disabled. The transaction SHALL have type "income", the job's price as amount, and reference the job. When a transaction is created, `updateJobStatus` SHALL update the job row and append the transaction in a single logical operation. If the job had no price before the transition, the price confirmed in the paid confirmation flow SHALL be written to the job row alongside the status change. The user MAY opt out via the jobs UI (e.g. unchecked "create income transaction" on the paid confirmation dialog); when opted out, the job row SHALL still update to "paid" with the confirmed price but **no** new transaction row SHALL be appended. Leaving "paid" and entering "paid" again later without opt-out MAY append another income transaction; the UI SHALL confirm before leaving "paid" to reduce duplicate risk.

#### Scenario: Job payment creates transaction by default

- **WHEN** job.status changes to "paid" via `updateJobStatus` with default income-transaction behavior
- **THEN** transaction is created with:
  - type: "income"
  - amount: job.price
  - category: "job"
  - concept: job.description
  - ref_type: "job"
  - ref_id: job.id
  - client_id: job.client_id

#### Scenario: Job payment without new transaction when user opts out

- **WHEN** job.status changes to "paid" and the user has opted out of creating an income transaction
- **THEN** the job row is updated to paid with the agreed price
- **AND** no new row is appended to the transactions sheet

#### Scenario: Price written during paid transition

- **WHEN** job.status changes to "paid" via `updateJobStatus`
- **AND** a price is provided in the paid confirmation flow
- **THEN** the job's price field is updated to the provided value
- **AND** when a transaction is created, it uses the provided price as amount

#### Scenario: Zero price creates zero-amount transaction

- **WHEN** job.status changes to "paid" with price 0 and default income-transaction behavior
- **THEN** a transaction is created with amount 0
- **AND** this is valid (gift job)

### Requirement: Expenses page displays expense table

The system SHALL provide an `/expenses` route that displays a table of all expenses from the expenses sheet. The table SHALL show: date, category, amount, notes, inventory link column when applicable, and per-row actions to edit and delete each expense. The expenses page SHALL additionally fetch inventory data and display a link on expense rows that have an associated inventory item. The link SHALL navigate to `/inventory`.

#### Scenario: Expenses table renders with data

- **WHEN** user navigates to /expenses
- **THEN** table displays all expenses sorted by date descending
- **AND** each row includes Edit and Delete actions when expenses exist

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

The system SHALL provide a CreateExpensePopup component that renders a modal with a form. The form SHALL collect: date (YYYY-MM-DD), category (enum: filament, consumable, electric, investment, maintenance, other), amount (number), notes (optional). The form SHALL include an "Add to inventory" toggle when creating a new expense. When the toggle is checked, the form SHALL additionally collect: inventory type (enum: filament, consumable, equipment), inventory name (prefilled from notes, editable), and quantity (number, > 0). The popup SHALL be closable and usable from multiple pages. The same component SHALL support an edit mode for an existing expense: fields SHALL be prefilled; the inventory toggle and inventory fields SHALL NOT be shown; submit SHALL update the expense and keep the linked transaction consistent.

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

#### Scenario: Edit mode hides inventory section

- **WHEN** user opens the popup in edit mode for an expense
- **THEN** date, category, amount, and notes are prefilled
- **AND** "Add to inventory" and related inventory fields are not shown

#### Scenario: Successful edit updates expense and linked transaction

- **WHEN** user submits valid changes in edit mode
- **THEN** the expense row is updated in the expenses sheet
- **AND** the transaction row linked via ref_type expense and ref_id is updated to match amount, date, category, concept, and notes conventions used on create

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

The system SHALL validate the expense form before submission. Date SHALL be required and in YYYY-MM-DD format. Category SHALL be required. Amount SHALL be required and MUST be greater than zero. Notes MAY be empty. In create mode only, when the "Add to inventory" toggle is checked: inventory type SHALL be required, inventory name SHALL be required, and quantity SHALL be required and MUST be greater than zero. In edit mode, inventory fields are not shown and inventory validation SHALL NOT apply.

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

### Requirement: Expense delete uses confirmation dialog

The system SHALL require confirmation before deleting an expense using the existing ConfirmDialog pattern.

#### Scenario: Delete prompts for confirmation

- **WHEN** user clicks Delete on an expense row
- **THEN** a confirmation dialog is shown

#### Scenario: Cancel leaves data unchanged

- **WHEN** user cancels the delete confirmation
- **THEN** the expense row remains in the sheet and table

### Requirement: deleteExpense removes expense and related records

The system SHALL provide a `deleteExpense` service that removes the expense row, removes all transaction rows where `ref_type` is expense and `ref_id` matches the expense id, and removes any inventory row whose `expense_id` matches that expense id. Operations SHALL use `SheetsRepository.deleteRow` (or equivalent) without modifying unrelated rows.

#### Scenario: Expense with transaction deleted

- **WHEN** deleteExpense is called for an expense that has a matching expense transaction row
- **THEN** both the expense row and the matching transaction row are removed

#### Scenario: Expense with inventory deleted

- **WHEN** deleteExpense is called for an expense that has an inventory row with the same expense_id
- **THEN** the inventory row is removed along with the expense and its transaction row

### Requirement: updateExpense service updates expense row

The system SHALL provide an `updateExpense` service that updates the expense row via `updateRow` and updates the linked expense transaction row to reflect the new date, amount (negative expense amount), category, concept, and notes consistent with expense creation rules.

#### Scenario: Expense and transaction stay aligned

- **WHEN** updateExpense changes amount or category
- **THEN** the linked transaction reflects the same business values as after a newly created expense

### Requirement: Optimistic update for expense edit

The expenses table UI SHALL apply an optimistic update when an expense edit save is triggered, and SHALL reconcile on error.

#### Scenario: Table shows edited expense optimistically

- **WHEN** user saves an expense edit
- **THEN** the table reflects the new values before or without waiting for a full refetch

### Requirement: Expenses UI strings include edit and delete

All new user-visible strings for expense edit, delete, and confirmation flows on the expenses page SHALL use i18next keys.

#### Scenario: Edit and delete labels are translatable

- **WHEN** expenses table renders actions
- **THEN** action labels and confirm copy use i18n keys

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
