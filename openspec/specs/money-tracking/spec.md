# money-tracking Specification

## Purpose

Financial tracking for illo3d: transactions presentation, clients page (list, create, edit, and delete), domain data models (clients, jobs, pieces, piece_items, inventory, lots, transactions), automated transaction flows, lot-based suggested pricing, and purchase recording via the UI (see `purchase-recording` capability).

## Requirements

### Requirement: Transactions table is displayed

The system SHALL display a table of all transactions from the transactions sheet. The table SHALL show: date, type (income/expense), amount, category, concept, client name (if applicable). When a transaction row has a `client_id` that resolves to a client name, the client name cell SHALL be the visible text of a link to `/clients/:clientId` for that id. When a transaction has `ref_type` `job` and a non-empty `ref_id`, the concept cell SHALL display the concept string as the visible text of a link to `/jobs/:ref_id`. When a transaction is of type `expense` and has linked lots (matched via `lots.transaction_id`), the concept cell SHALL display the concept string as the visible text of a link to `/inventory`. When none of these link rules apply, the concept cell SHALL show plain text only (no link).

#### Scenario: Transactions table renders with data

- **WHEN** user navigates to transactions view
- **THEN** table displays all transactions sorted by date descending

#### Scenario: Empty state shown when no transactions

- **WHEN** user navigates to transactions view
- **AND** no transactions exist
- **THEN** table shows empty state message

#### Scenario: Client name links to client detail

- **WHEN** a transaction has client_id "CL1" and client CL1 exists
- **THEN** the client column shows a link to `/clients/CL1` labeled with the client name

#### Scenario: No link without client_id

- **WHEN** a transaction has no client_id
- **THEN** the client column shows empty or placeholder text and is not a link

#### Scenario: Job-backed transaction concept links to job detail

- **WHEN** a transaction has `ref_type` `job` and `ref_id` "J1"
- **THEN** the concept column shows a link to `/jobs/J1` whose visible text is the concept string

#### Scenario: Expense transaction with lots links concept to inventory

- **WHEN** a transaction is type `expense` and has at least one lot row with matching `transaction_id`
- **THEN** the concept column shows a link to `/inventory` whose visible text is the concept string

#### Scenario: Expense transaction without lots shows plain concept

- **WHEN** a transaction is type `expense` and has no lot rows with matching `transaction_id`
- **THEN** the concept column shows plain text only (no link)

### Requirement: Transactions table is read-only

The system SHALL NOT allow editing, adding, or deleting transactions directly from the transactions table UI. The transactions table SHALL have no add, edit, or delete controls. Expense-type transactions SHALL be created via the purchase recording flow (`purchase-recording`); income-type transactions SHALL be created when a job status changes to "paid" with default income behavior, or by other automated flows (see "Paying a job creates income transaction" for UI opt-out). Manual edits to transactions MAY be done directly in Google Sheets.

#### Scenario: No edit controls in UI

- **WHEN** user views transactions table
- **THEN** no add, edit, or delete buttons are visible on the table itself

#### Scenario: Expense transactions created via purchase recording

- **WHEN** user records a purchase via CreatePurchasePopup
- **THEN** a transaction record is created with type "expense" as defined in `purchase-recording`
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

The system SHALL support a clients data model with fields: id (string), name (string), email (string, optional), phone (string, optional), notes (string, optional), preferred_contact (string, optional), lead_source (string, optional), address (string, optional), created_at (date).

#### Scenario: Client has required fields

- **WHEN** a client record exists
- **THEN** it has id and name fields populated

### Requirement: CrmNote data model is defined

The system SHALL support CRM notes persisted in `crm_notes` with fields: id (string), entity_type (`client` | `job`), entity_id (string), body (string), referenced_entity_ids (string), severity (enum matching existing client-note severities), created_at (string). The `JobNote` and `ClientNote` shapes MAY be used as filtered views over `crm_notes` rows for the corresponding `entity_type`.

#### Scenario: Job-scoped CRM note references a job

- **WHEN** a CRM note exists with entity_type `job`
- **THEN** it has a non-empty `entity_id` matching a row in `jobs`

### Requirement: TagLink entity_type includes job

The `TagLink` type SHALL allow `entity_type` values including `client` and `job`, with `entity_id` referencing the corresponding primary sheet id.

### Requirement: Clients page is accessible from the app

The system SHALL include a `/clients` route protected by the same authentication guard as `/transactions`. The route SHALL be listed in the app header navigation.

#### Scenario: Clients route is protected

- **WHEN** an unauthenticated user navigates to `/clients`
- **THEN** the system redirects to `/login`

#### Scenario: Authenticated user accesses clients page

- **WHEN** an authenticated user navigates to `/clients`
- **THEN** the clients page renders without redirection

### Requirement: Job data model is defined

The system SHALL support a jobs data model with fields: id (string), client_id (string, FK to clients), description (string), status (enum: draft, in_progress, delivered, paid, cancelled), **legacy optional `price` (number) on the jobs sheet for backward compatibility only**, created_at (date). Canonical quoted revenue for a job SHALL be the sum of set `price` values on non-deleted pieces for that job, including archived pieces.

#### Scenario: Job linked to client

- **WHEN** a job record exists
- **THEN** it has valid client_id referencing an existing client

#### Scenario: Job status transitions

- **WHEN** job status changes to "paid" with default income-transaction behavior
- **THEN** a transaction record is created automatically (see "Paying a job creates income transaction" for opt-out)

### Requirement: Piece data model is defined

The system SHALL support a pieces data model with fields: id (string), job_id (string, FK to jobs), name (string), status (enum: pending, done, failed), **price (number, optional)**, created_at (date).

#### Scenario: Piece linked to job

- **WHEN** a piece record exists
- **THEN** it has valid job_id referencing an existing job

### Requirement: Piece_items data model is defined

The system SHALL support a piece_items data model with fields: id (string), piece_id (string, FK to pieces), inventory_id (string, FK to inventory), quantity (number).

#### Scenario: Piece_item links piece to inventory

- **WHEN** a piece_item record exists
- **THEN** it connects a piece to an inventory item with a quantity consumed

### Requirement: fetchPieces and usePieces read pieces sheet

The system SHALL provide `fetchPieces(spreadsheetId)` that reads all rows from the `pieces` sheet via `SheetsRepository`, filters out rows without `id`, parses `status` as a piece status, **parses optional `price` as a number or undefined if empty**, and returns `Piece` objects sorted by `created_at` descending. The system SHALL provide `usePieces(spreadsheetId)` using TanStack Query with query key `['pieces', spreadsheetId]`, following the same enabled/null pattern as `useJobs`.

#### Scenario: Hooks load when spreadsheet is available

- **WHEN** `usePieces` is used with a non-null spreadsheet id
- **THEN** data is fetched from the pieces sheet through `fetchPieces`

### Requirement: fetchPieceItems and usePieceItems read piece_items sheet

The system SHALL provide `fetchPieceItems(spreadsheetId)` that reads all rows from the `piece_items` sheet, filters rows without `id`, parses `quantity` as a number, and returns `PieceItem` objects. The system SHALL provide `usePieceItems(spreadsheetId)` with query key `['piece_items', spreadsheetId]`, following the same pattern as `usePieces`.

#### Scenario: Piece items available for grouping by piece

- **WHEN** `fetchPieceItems` completes successfully
- **THEN** each returned object includes `piece_id`, `inventory_id`, and numeric `quantity`

### Requirement: Piece rows expand to show piece_items

The system SHALL allow the user to expand a piece row to view a nested list of that piece's `piece_items`. The nested list SHALL show: piece_item id, inventory item name (resolved from the inventory sheet), quantity, **material cost** (quantity × avg unit cost from active lots for that `inventory_id` when computable; otherwise a placeholder such as em dash), remaining quantity (`qty_current` on the inventory item), and redo margin. The redo margin SHALL be calculated as `floor((qty_current - quantity) / quantity)` and displayed with a label: "safe" (2+ redos, green), "tight" (1 redo, yellow), or "risky" (0 redos, red). The nested section SHALL include a control to add a new piece_item to that piece. Collapsing a row SHALL hide its nested list.

#### Scenario: User expands a piece with lines

- **WHEN** the user expands a piece that has piece_items
- **THEN** each related piece_item appears with inventory name, quantity, **material cost**, remaining quantity, and redo margin indicator

#### Scenario: Material cost column formats currency when computable

- **WHEN** a piece_item references an inventory item with active lots yielding a defined avg unit cost
- **THEN** the material cost cell shows currency-formatted `quantity × avg_unit_cost`

#### Scenario: Piece_item shows risky redo margin

- **WHEN** a piece_item requires 450g and the lot has 500g remaining
- **THEN** the redo margin shows "tight (1 redo)" in yellow

#### Scenario: Piece_item shows safe redo margin

- **WHEN** a piece_item requires 42g and the lot has 916g remaining
- **THEN** the redo margin shows "safe (21 redos)" in green

### Requirement: CreatePiecePopup creates a piece for a selected job

The system SHALL provide `CreatePiecePopup` that collects a required piece name **and optional piece price (number, 0 allowed)**. When opened from a context without a fixed job, the popup SHALL also collect a required job via a searchable list from cached jobs data (same interaction pattern as `CreateJobPopup` client picker). When opened from a job detail page, the job SHALL be fixed to that job and the job picker SHALL NOT be shown. On successful submit, the system SHALL call `createPiece` to append a row with generated `P`-prefixed id, `status` `pending`, **optional price**, and current ISO timestamp for `created_at`. The popup SHALL be closable without saving. All user-visible strings SHALL use i18n (English and Spanish).

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

The system SHALL provide `createPiece(spreadsheetId, { job_id, name, price? })` that generates the next `P`-prefixed id from existing piece ids, and appends one row to the `pieces` sheet with `status` `pending`, **`price` if provided**, and `created_at` set to the current time in ISO-8601 format.

#### Scenario: Id increments after existing pieces

- **WHEN** pieces `P1` and `P2` already exist
- **AND** `createPiece` is invoked
- **THEN** the appended row has id `P3`

### Requirement: CreatePieceItemPopup allocates inventory to a piece

The system SHALL provide `CreatePieceItemPopup` that collects a required inventory item (select from cached inventory) and a required quantity greater than zero. Each option in the inventory select SHALL display the item name, id, and remaining quantity (e.g. "PLA White (INV1) — 958g left"). On success it SHALL call `createPieceItem` to append a `piece_items` row. The form layout and validation style SHALL follow `CreatePurchasePopup` patterns (overlay close, inline field errors, submit/cancel). All user-visible strings SHALL use i18n. Creating a piece_item SHALL NOT modify `inventory.qty_current`.

#### Scenario: Valid line appends piece_item

- **WHEN** the user chooses an inventory item and enters a positive quantity and submits
- **THEN** a new row is appended to the piece_items sheet for the given piece
- **AND** inventory quantities are unchanged

#### Scenario: Lot picker shows remaining quantity

- **WHEN** the user opens the inventory item dropdown
- **THEN** each option displays the item name, id, and current remaining quantity

#### Scenario: Non-positive quantity is rejected

- **WHEN** the user submits quantity zero or negative
- **THEN** a validation error is shown
- **AND** no row is appended

### Requirement: createPieceItem service appends piece_items

The system SHALL provide `createPieceItem(spreadsheetId, { piece_id, inventory_id, quantity })` that generates the next `PI`-prefixed id from existing piece_item ids and appends one row linking the piece, inventory item, and quantity.

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

The system SHALL show a `ConfirmDialog` when piece status changes to `done` or `failed`. The dialog SHALL contain a pre-checked checkbox labeled "Decrement from inventory" (i18n). If all referenced inventory items have sufficient `qty_current` (>= piece_item quantity), the dialog SHALL show a standard confirmation message. If any inventory item has insufficient stock, the dialog SHALL show a warning message identifying the insufficient items but SHALL NOT block confirmation — the user MAY uncheck the decrement checkbox and proceed, or cancel.

#### Scenario: Sufficient stock shows standard confirmation

- **WHEN** user selects "done" for a piece with piece_items
- **AND** all referenced inventory items have sufficient qty_current
- **THEN** dialog shows with pre-checked "Decrement from inventory" checkbox
- **AND** confirm button is enabled

#### Scenario: Insufficient stock shows warning but allows proceed

- **WHEN** user selects "done" for a piece with piece_items
- **AND** at least one referenced inventory item has insufficient qty_current
- **THEN** dialog shows a warning identifying the insufficient item(s)
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
- **THEN** each piece_item's quantity is added back to the inventory item's qty_current
- **AND** piece status is updated to "pending"

### Requirement: updatePieceStatus service orchestrates status and inventory

The system SHALL provide `updatePieceStatus(spreadsheetId, piece, newStatus, options)` that:
1. Reads the pieces sheet to find the piece's row index.
2. Reads piece_items filtered by piece_id.
3. Reads inventory sheet.
4. If `decrementInventory` is true and new status is `done` or `failed`: validates all inventory items have sufficient qty_current, then decrements each inventory item's `qty_current` by the corresponding piece_item quantity via `updateRow`.
5. If `restoreInventory` is true and old status was `done` or `failed` and new status is `pending`: increments each inventory item's `qty_current` by the corresponding piece_item quantity via `updateRow`.
6. Updates the piece row status via `updateRow`.

The function SHALL return an error result (not throw) when validation fails, including details of which inventory items are insufficient.

#### Scenario: Successful decrement updates inventory and piece

- **WHEN** `updatePieceStatus` is called with `decrementInventory: true` for status "done"
- **AND** all inventory items have sufficient stock
- **THEN** each referenced inventory item's `qty_current` is decremented
- **AND** the piece row status is updated to "done"

#### Scenario: Validation failure returns error details

- **WHEN** `updatePieceStatus` is called with `decrementInventory: true`
- **AND** lot INV1 has `qty_current` 30 but piece_item requires 42
- **THEN** the function returns an error result identifying INV1 as insufficient
- **AND** no sheet rows are modified

#### Scenario: Restore increments inventory

- **WHEN** `updatePieceStatus` is called with `restoreInventory: true` moving from "done" to "pending"
- **THEN** each referenced inventory item's `qty_current` is incremented by the piece_item quantity
- **AND** the piece row status is updated to "pending"

#### Scenario: Skip decrement updates only piece

- **WHEN** `updatePieceStatus` is called with `decrementInventory: false`
- **THEN** the piece row status is updated
- **AND** no inventory rows are modified

### Requirement: Inventory data model is defined

The system SHALL support an inventory data model with fields: id (string), type (enum: filament, consumable, equipment), name (string), qty_current (number), warn_yellow (number, default 0), warn_orange (number, default 0), warn_red (number, default 0), created_at (date).

#### Scenario: Inventory item represents material identity

- **WHEN** an inventory item "PLA White" exists
- **THEN** it has a unique id, type=filament, name="PLA White", and a qty_current reflecting total stock

#### Scenario: Inventory thresholds are configurable

- **WHEN** an inventory item is created
- **THEN** warn_yellow, warn_orange, and warn_red default to 0 (disabled)

### Requirement: Fixture data reflects inventory consumption

The happy-path fixture data SHALL include pieces with realistic statuses and inventory quantities that reflect consumption. At least one piece SHALL have status `done` with piece_items, and the referenced inventory item's `qty_current` SHALL be decremented by the sum of those piece_items' quantities.

#### Scenario: Fixture inventory reflects completed piece

- **WHEN** fixture piece P3 has status "done" with piece_item PI3 consuming 15g from INV1
- **THEN** fixture INV1 `qty_current` SHALL reflect consumption of 15 units by that completed piece (per golden fixture values)

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

### Requirement: Transaction data model is defined

The system SHALL support a transactions data model with fields: id (string), date (date), type (enum: income, expense), amount (number), category (string), concept (string), ref_type (string, `job` for income transactions, empty for expense transactions), ref_id (string, job_id for income transactions, empty for expense transactions), client_id (string, optional), notes (string, optional).

#### Scenario: Transaction references its source

- **WHEN** an income transaction record exists
- **THEN** ref_type is `job` and ref_id identifies the job that created it

#### Scenario: Expense transaction has no ref

- **WHEN** an expense transaction record exists
- **THEN** ref_type and ref_id are empty — lots reference the transaction instead

### Requirement: Job detail fetches lots and inventory for price suggestion

The job detail page SHALL fetch lot and inventory rows for the active spreadsheet so per-piece suggested pricing can compute average unit cost from lots for each inventory item.

#### Scenario: Lots and inventory loaded with job detail

- **WHEN** an authenticated user views job detail with a connected spreadsheet
- **THEN** the client loads lots and inventory in addition to jobs, pieces, and piece_items

### Requirement: Per-piece price is suggested based on materials

The system SHALL surface a **suggested** price per piece derived from BOM material cost. For a given piece, the material subtotal SHALL be the sum of every `piece_item` on that piece: `piece_item.quantity × avg_unit_cost`, where `avg_unit_cost` for the referenced inventory item is `Σ(lot.amount) / Σ(lot.quantity)` across all active lots for that inventory_id. All `InventoryType` values (`filament`, `consumable`, `equipment`) SHALL use the same rule. The suggested price SHALL be the material subtotal multiplied by **3** (hardcoded).

When a piece has **no** `piece_items`, the system SHALL **not** render the suggestion for that piece.

When **any** `piece_item` references an inventory item that has no active lots or whose `avg_unit_cost` cannot be computed (missing inventory row, no lots, or total quantity not strictly greater than zero), the system SHALL show an error state listing affected inventory items.

The displayed suggestion SHALL **recompute** when inputs change (including after workbook refresh or invalidation of pieces, piece_items, lots, or inventory).

#### Scenario: Per-piece BOM suggestion shown

- **WHEN** a piece has piece_items referencing inventory items with lots
- **THEN** the suggestion shows material subtotal and suggested price (subtotal × 3) for that piece

#### Scenario: Hidden when piece has no piece_items

- **WHEN** a piece has no piece_items
- **THEN** no suggestion is shown for that piece

#### Scenario: Error when cost cannot be computed

- **WHEN** any piece_item references an inventory item with no active lots
- **THEN** suggestion shows error listing affected items by id/name

#### Scenario: Average cost from lots

- **WHEN** an inventory item has lots with amounts [29.99, 18.99] and quantities [1000, 500]
- **THEN** avg_unit_cost = (29.99 + 18.99) / (1000 + 500) = 0.03265...

### Requirement: Material cost per piece-item line uses lot-based avg cost

The system SHALL provide a `materialCostForPieceItemLine` utility that computes `quantity × avg_unit_cost` for a single piece_item line, where avg_unit_cost is derived from all active lots for the referenced inventory item. If the inventory item is missing or has no lots with positive total quantity, the function SHALL return null.

#### Scenario: Cost computed from lots

- **WHEN** a piece_item references inventory "PLA White" with lots totaling 1500qty and €48.98 cost, and piece_item.quantity is 15
- **THEN** materialCostForPieceItemLine returns 15 × (48.98 / 1500) = 0.4898...

#### Scenario: Missing inventory returns null

- **WHEN** a piece_item references a non-existent inventory_id
- **THEN** materialCostForPieceItemLine returns null

### Requirement: Paying a job creates income transaction

The system SHALL create an income transaction when a job status changes to "paid" **by default**, via the `updateJobStatus` service when income creation is not disabled. The transaction SHALL have type "income", amount equal to **derived total** (sum of **set** piece prices on **non-deleted** pieces **including archived**), and reference the job. **Derived total** MAY be 0 when pieces are explicitly priced at zero. When a transaction is created, `updateJobStatus` SHALL update the job row and append the transaction in a single logical operation. The transition to paid SHALL be **rejected** if any counting piece has **unset** `price` (see job-management paid gating). The user MAY opt out via the jobs UI (e.g. unchecked "create income transaction" on the paid confirmation dialog); when opted out, the job row SHALL still update to "paid" but **no** new transaction row SHALL be appended. Leaving "paid" and entering "paid" again later without opt-out MAY append another income transaction; the UI SHALL confirm before leaving "paid" to reduce duplicate risk.

#### Scenario: Job payment creates transaction by default

- **WHEN** job.status changes to "paid" via `updateJobStatus` with default income-transaction behavior
- **THEN** transaction is created with:
  - type: "income"
  - amount: **derived total**
  - category: "job"
  - concept: job.description
  - ref_type: "job"
  - ref_id: job.id
  - client_id: job.client_id

#### Scenario: Job payment without new transaction when user opts out

- **WHEN** job.status changes to "paid" and the user has opted out of creating an income transaction
- **THEN** the job row is updated to paid
- **AND** no new row is appended to the transactions sheet

#### Scenario: Zero payment amount creates zero-amount transaction

- **WHEN** job.status changes to "paid" with confirmed amount 0 and default income-transaction behavior
- **THEN** a transaction is created with amount 0
- **AND** this is valid (gift job)

### Requirement: updatePiecePrice updates piece quote

The system SHALL provide a way to persist an optional `price` on an existing piece (e.g. `updatePiece` or dedicated `updatePiecePrice`) in the workbook store, validating numeric input and preserving other piece fields.

#### Scenario: Price update writes pieces sheet

- **WHEN** the user saves a new price for piece "P1"
- **THEN** the pieces matrix row for P1 reflects the updated `price` after save

### Requirement: UI strings support i18n

All user-facing strings in the transactions view SHALL use i18next for translation support.

#### Scenario: Table headers are translatable

- **WHEN** transactions table renders
- **THEN** column headers come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown
- **THEN** message comes from i18n keys
