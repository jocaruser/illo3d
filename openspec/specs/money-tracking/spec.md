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
- **AND** the user confirms with "Decrement from inventory" checked
- **THEN** inventory `qty_current` is decremented by `piece_item.quantity` for each piece_item of that piece
- **AND** the piece status is updated in the pieces sheet

#### Scenario: Piece completion without inventory decrement

- **WHEN** piece status changes to "done" or "failed"
- **AND** the user unchecks "Decrement from inventory"
- **THEN** the piece status is updated in the pieces sheet
- **AND** inventory `qty_current` is NOT modified

#### Scenario: Piece reverts from consuming status to pending

- **WHEN** piece status changes from "done" or "failed" back to "pending"
- **AND** the user confirms with "Restore inventory quantities" checked
- **THEN** inventory `qty_current` is incremented by `piece_item.quantity` for each piece_item of that piece
- **AND** the piece status is updated to "pending"

#### Scenario: Piece reverts without inventory restoration

- **WHEN** piece status changes from "done" or "failed" back to "pending"
- **AND** the user unchecks "Restore inventory quantities"
- **THEN** the piece status is updated to "pending"
- **AND** inventory `qty_current` is NOT modified

### Requirement: Piece_items data model is defined

The system SHALL support a piece_items data model with fields: id (string), piece_id (string, FK to pieces), inventory_id (string, FK to inventory), quantity (number).

#### Scenario: Piece_item links piece to inventory

- **WHEN** a piece_item record exists
- **THEN** it connects a piece to an inventory lote with a quantity consumed

### Requirement: Job detail page lists pieces for that job

The system SHALL provide a job detail route `/jobs/:jobId` protected by the same authentication guard as `/jobs`. The system SHALL NOT provide a top-level Pieces tab or `/pieces` route. When the sheet connection is connected, the job detail page SHALL show a summary of the job (description, id, client, status, price, created_at) and a **Pieces** section. The Pieces section SHALL list only pieces whose `job_id` matches `:jobId`, with columns: id, name, status (as a dropdown with `pending`, `done`, `failed` options and i18n labels), and `created_at` (job reference column omitted on this page). Rows SHALL be sorted by `created_at` descending. When no pieces exist for the job, the Pieces section SHALL show an empty state message using i18n.

#### Scenario: Authenticated user opens job detail with pieces

- **WHEN** an authenticated user with an active shop navigates to `/jobs/J1`
- **AND** the spreadsheet connection succeeds
- **AND** pieces exist for that job
- **THEN** the Pieces section shows those pieces with a status dropdown per row
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

The system SHALL allow the user to expand a piece row to view a nested list of that piece's `piece_items`. The nested list SHALL show: piece_item id, inventory lot name (resolved from the inventory sheet), quantity, remaining lot quantity (`qty_current`), and redo margin. The redo margin SHALL be calculated as `floor((qty_current - quantity) / quantity)` and displayed with a label: "safe" (2+ redos, green), "tight" (1 redo, yellow), or "risky" (0 redos, red). The nested section SHALL include a control to add a new piece_item to that piece. Collapsing a row SHALL hide its nested list.

#### Scenario: User expands a piece with lines

- **WHEN** the user expands a piece that has piece_items
- **THEN** each related piece_item appears with inventory name, quantity, remaining lot quantity, and redo margin indicator

#### Scenario: Piece_item shows risky redo margin

- **WHEN** a piece_item requires 450g and the lot has 500g remaining
- **THEN** the redo margin shows "tight (1 redo)" in yellow

#### Scenario: Piece_item shows safe redo margin

- **WHEN** a piece_item requires 42g and the lot has 916g remaining
- **THEN** the redo margin shows "safe (21 redos)" in green

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

The system SHALL provide `CreatePieceItemPopup` that collects a required inventory lot (select from cached inventory) and a required quantity greater than zero. Each option in the inventory select SHALL display the lot name, id, and remaining quantity (e.g. "PLA White (INV1) — 958g left"). On success it SHALL call `createPieceItem` to append a `piece_items` row. The form layout and validation style SHALL follow `CreateExpensePopup` (overlay close, inline field errors, submit/cancel). All user-visible strings SHALL use i18n. Creating a piece_item SHALL NOT modify `inventory.qty_current`.

#### Scenario: Valid line appends piece_item

- **WHEN** the user chooses an inventory lot and enters a positive quantity and submits
- **THEN** a new row is appended to the piece_items sheet for the given piece
- **AND** inventory quantities are unchanged

#### Scenario: Lot picker shows remaining quantity

- **WHEN** the user opens the inventory lot dropdown
- **THEN** each option displays the lot name, id, and current remaining quantity

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

### Requirement: Piece status is changeable via dropdown

The system SHALL display a `PieceStatusDropdown` component in `PiecesTable` for each piece row, replacing the plain text status display. The dropdown SHALL list all `PieceStatus` values (`pending`, `done`, `failed`) with i18n labels. Changing the dropdown value SHALL trigger a confirmation flow before updating the piece status.

#### Scenario: User changes piece status to done

- **WHEN** the user selects "done" from the piece status dropdown
- **THEN** a confirmation dialog is shown before the status is updated

#### Scenario: Status dropdown is disabled during update

- **WHEN** a piece status update is in progress
- **THEN** the dropdown for that piece is disabled

### Requirement: Confirmation dialog shown before consuming status transition

The system SHALL show a `ConfirmDialog` when piece status changes to `done` or `failed`. The dialog SHALL contain a pre-checked checkbox labeled "Decrement from inventory" (i18n). If all referenced inventory lots have sufficient `qty_current` (>= piece_item quantity), the dialog SHALL show a standard confirmation message. If any lot has insufficient stock, the dialog SHALL show a warning message identifying the insufficient lots but SHALL NOT block confirmation — the user MAY uncheck the decrement checkbox and proceed, or cancel.

#### Scenario: Sufficient stock shows standard confirmation

- **WHEN** user selects "done" for a piece with piece_items
- **AND** all referenced lots have sufficient qty_current
- **THEN** dialog shows with pre-checked "Decrement from inventory" checkbox
- **AND** confirm button is enabled

#### Scenario: Insufficient stock shows warning but allows proceed

- **WHEN** user selects "done" for a piece with piece_items
- **AND** at least one referenced lot has insufficient qty_current
- **THEN** dialog shows a warning identifying the insufficient lot(s)
- **AND** "Decrement from inventory" checkbox is shown (user can uncheck to skip)
- **AND** confirm button is enabled

#### Scenario: Piece with no piece_items blocks consuming transition

- **WHEN** user selects "done" or "failed" for a piece with zero piece_items
- **THEN** the transition is blocked
- **AND** an error message is shown indicating at least one piece_item is required

### Requirement: Confirmation dialog shown before reverting from consuming status

The system SHALL show a `ConfirmDialog` when piece status changes from `done` or `failed` back to `pending`. The dialog SHALL contain a pre-checked checkbox labeled "Restore inventory quantities" (i18n). The user MAY uncheck to skip restoration.

#### Scenario: Reverting to pending offers restore

- **WHEN** user selects "pending" for a piece currently in "done" status
- **THEN** dialog shows with pre-checked "Restore inventory quantities" checkbox

#### Scenario: User confirms revert with restore

- **WHEN** user confirms revert with "Restore inventory quantities" checked
- **THEN** each piece_item's quantity is added back to the lot's qty_current
- **AND** piece status is updated to "pending"

### Requirement: updatePieceStatus service orchestrates status and inventory

The system SHALL provide `updatePieceStatus(spreadsheetId, piece, newStatus, options)` that:
1. Reads the pieces sheet to find the piece's row index.
2. Reads piece_items filtered by piece_id.
3. Reads inventory sheet.
4. If `decrementInventory` is true and new status is `done` or `failed`: validates all lots have sufficient qty_current, then decrements each lot's `qty_current` by the corresponding piece_item quantity via `updateRow`.
5. If `restoreInventory` is true and old status was `done` or `failed` and new status is `pending`: increments each lot's `qty_current` by the corresponding piece_item quantity via `updateRow`.
6. Updates the piece row status via `updateRow`.

The function SHALL return an error result (not throw) when validation fails, including details of which lots are insufficient.

#### Scenario: Successful decrement updates inventory and piece

- **WHEN** `updatePieceStatus` is called with `decrementInventory: true` for status "done"
- **AND** all lots have sufficient stock
- **THEN** each referenced lot's `qty_current` is decremented
- **AND** the piece row status is updated to "done"

#### Scenario: Validation failure returns error details

- **WHEN** `updatePieceStatus` is called with `decrementInventory: true`
- **AND** lot INV1 has `qty_current` 30 but piece_item requires 42
- **THEN** the function returns an error result identifying INV1 as insufficient
- **AND** no sheet rows are modified

#### Scenario: Restore increments inventory

- **WHEN** `updatePieceStatus` is called with `restoreInventory: true` moving from "done" to "pending"
- **THEN** each referenced lot's `qty_current` is incremented by the piece_item quantity
- **AND** the piece row status is updated to "pending"

#### Scenario: Skip decrement updates only piece

- **WHEN** `updatePieceStatus` is called with `decrementInventory: false`
- **THEN** the piece row status is updated
- **AND** no inventory rows are modified

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

### Requirement: Inventory table shows low-stock indicator

The system SHALL visually indicate inventory stock levels in `InventoryTable` by coloring the `qty_current` cell based on the ratio `qty_current / qty_initial`:
- Ratio > 0.5: no highlight (default)
- Ratio > 0.3: yellow background
- Ratio > 0.1: orange background
- Ratio ≤ 0.1: red background

Equipment items (`qty_initial` ≤ 1) SHALL be excluded from low-stock coloring.

#### Scenario: Filament lot at 25% shows orange

- **WHEN** a filament lot has `qty_initial` 1000 and `qty_current` 250
- **THEN** the `qty_current` cell has an orange background

#### Scenario: Filament lot at 60% shows no highlight

- **WHEN** a filament lot has `qty_initial` 1000 and `qty_current` 600
- **THEN** the `qty_current` cell has no special background

#### Scenario: Equipment excluded from coloring

- **WHEN** an equipment item has `qty_initial` 1 and `qty_current` 1
- **THEN** the `qty_current` cell has no special background

### Requirement: Fixture data reflects inventory consumption

The happy-path fixture data SHALL include pieces with realistic statuses and inventory quantities that reflect consumption. At least one piece SHALL have status `done` with piece_items, and the referenced inventory lot's `qty_current` SHALL be decremented by the sum of those piece_items' quantities.

#### Scenario: Fixture inventory reflects completed piece

- **WHEN** fixture piece P3 has status "done" with piece_item PI3 consuming 15g from INV1
- **THEN** fixture INV1 `qty_current` SHALL be `qty_initial - 15` (985)

### Requirement: Piece status change UI strings support i18n

All user-facing strings for piece status changes SHALL use i18next keys, including: confirmation dialog titles and messages, checkbox labels ("Decrement from inventory", "Restore inventory quantities"), insufficient stock warnings, and the "at least one piece_item required" error. Both English and Spanish translations SHALL be provided.

#### Scenario: Confirmation labels are translatable

- **WHEN** the piece status confirmation dialog renders
- **THEN** all labels and messages come from i18n keys

### Requirement: Piece_item redo margin UI strings support i18n

All user-facing strings for redo margin display SHALL use i18next keys, including "safe", "tight", "risky" labels and the "(N redos)" / "(N redo)" text. The remaining quantity suffix (e.g. "g left") SHALL use i18n keys.

#### Scenario: Redo margin labels are translatable

- **WHEN** a piece_item row renders the redo margin
- **THEN** margin labels come from i18n keys

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

### Requirement: Job detail fetches expenses for price suggestion

The job detail page SHALL fetch expense rows for the active spreadsheet so suggested pricing can resolve `expense.amount` for each inventory lot’s `expense_id`.

#### Scenario: Expenses loaded with job detail

- **WHEN** an authenticated user views job detail with a connected spreadsheet
- **THEN** the client loads expenses in addition to jobs, pieces, piece_items, and inventory

### Requirement: Job price is suggested based on materials

The system SHALL surface a **suggested** job price derived from BOM material cost when the user opens **Edit job** from the **job detail** page (`/jobs/:jobId`). The material subtotal SHALL be the sum, over **every** `piece` with that `job_id` and **every** `status` (`pending`, `done`, `failed`), of every `piece_item` on that piece: `piece_item.quantity × unit_cost`, where `unit_cost` for the referenced inventory lot is `expense.amount / inventory.qty_initial` using the `expense` row linked by `inventory.expense_id`. All `InventoryType` values (`filament`, `consumable`, `equipment`) SHALL use the same rule. The suggested price SHALL be the material subtotal multiplied by **3** (hardcoded). The system SHALL NOT persist the suggested price unless the user saves the job form with that value in the price field.

The suggestion affordance SHALL appear **beside** the optional price input in the same dialog used to edit a job (`CreateJobPopup`) **only** when that dialog is opened from the job detail page. The jobs list **create-job** flow SHALL NOT show this suggestion.

When the job has **no** pieces, or its pieces have **no** `piece_items` rows in aggregate, the system SHALL **not** render the suggestion region (including no €0).

When **any** `piece_item` line requires a lot whose `unit_cost` cannot be computed (missing inventory row, missing or unmatched expense for `expense_id`, or `qty_initial` not strictly greater than zero), the system SHALL **not** show a numeric suggestion or partial total; it SHALL show **only** an error state that lists every affected lot with identifiable **id** and/or **name**, using i18n-capable copy.

When `unit_cost` can be computed, `expense.amount` MAY be zero (yielding zero unit cost for that lot).

The displayed suggestion SHALL **recompute** when inputs change (including after TanStack Query refresh or invalidation of pieces, piece_items, inventory, or expenses).

The system SHALL **not** copy the suggested amount into the price field when the dialog opens; the field SHALL continue to reflect the stored `job.price` when editing. When the user activates the suggested price control (e.g. button click), the price field SHALL be set to the suggested amount **rounded to two decimal places**, replacing the current input value.

All user-visible labels, errors, and helper text for this feature SHALL use i18next with English and Spanish entries.

#### Scenario: Material cost includes all piece statuses

- **WHEN** a job has pieces in `pending`, `done`, and `failed` with `piece_items`
- **THEN** the material subtotal includes quantities from every such piece

#### Scenario: Suggested price is three times material subtotal

- **WHEN** the material subtotal is computable for the job
- **THEN** the suggested price equals that subtotal multiplied by 3

#### Scenario: Unit cost uses purchase amount and initial quantity

- **WHEN** an inventory lot has `qty_initial` greater than zero and a linked expense with amount `A`
- **THEN** `unit_cost` for that lot is `A / qty_initial` for suggestion purposes

#### Scenario: No suggestion when there is no BOM

- **WHEN** the job has no pieces, or no `piece_items` exist for any of its pieces
- **THEN** the suggestion region is not shown

#### Scenario: Error when any referenced lot cannot be priced

- **WHEN** at least one `piece_item` references a lot that cannot yield `unit_cost`
- **THEN** no numeric suggestion is shown
- **AND** an error lists each affected inventory lot (id and/or name)

#### Scenario: Suggestion not on jobs list create

- **WHEN** the user opens create job from the jobs list
- **THEN** no material-based price suggestion is shown

#### Scenario: Click applies rounded suggestion to price field

- **WHEN** a numeric suggestion is shown and the user activates the apply control
- **THEN** the price input updates to the suggested value rounded to two decimal places

#### Scenario: Dialog open does not auto-apply suggestion

- **WHEN** the user opens edit job from job detail
- **THEN** the price field is not filled from the suggestion until the user activates the apply control

#### Scenario: Custom price still used when saved

- **WHEN** the user sets a custom price and saves the job
- **THEN** the stored job price is the saved value (suggestion is advisory only until applied)

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
