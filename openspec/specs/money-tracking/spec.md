# money-tracking Specification

## Purpose

Financial tracking for illo3d: transactions presentation, clients page (list, create, edit, and delete), domain data models (clients, jobs, pieces, piece_items, inventory, lots, transactions), automated transaction flows, lot-based suggested pricing, and purchase recording via the UI (see `purchase-recording` capability).

## Requirements

### Requirement: Transactions table is displayed

The system SHALL display a table of all transactions from the transactions sheet. The table SHALL show: date, type (income/expense), amount, category, concept, client name (if applicable). When a transaction row has a `client_id` that resolves to a client name, the client name cell SHALL be the visible text of a link to `/clients/:clientId` for that id. When a transaction has `ref_type` `job` and a non-empty `ref_id`, the concept cell SHALL display the concept string as the visible text of a link to `/jobs/:ref_id`. When a transaction is of type `expense` and has linked lots (matched via `lots.transaction_id`), the concept cell SHALL display the concept string as the visible text of a link to `/transactions/:transactionId` for that transaction’s `id`. When none of these link rules apply, the concept cell SHALL show plain text only (no link).

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

#### Scenario: Expense transaction with lots links concept to expense transaction detail

- **WHEN** a transaction is type `expense` with id `T1` and has at least one lot row with matching `transaction_id`
- **THEN** the concept column shows a link to `/transactions/T1` whose visible text is the concept string

#### Scenario: Expense transaction without lots shows plain concept

- **WHEN** a transaction is type `expense` and has no lot rows with matching `transaction_id`
- **THEN** the concept column shows plain text only (no link)

### Requirement: Expense transaction detail route

The system SHALL provide a protected route **`/transactions/:transactionId`**. When the workbook is **connected** and a transaction row exists for `transactionId` with **`type`** `expense` (among rows shown in the transactions list per existing active-row rules), the system SHALL render an **expense transaction detail** page. When no such row exists, or the row’s **`type`** is not `expense`, the system SHALL show a **not-found** presentation consistent with other detail routes, including a way to navigate back to **`/transactions`**. Unauthenticated users SHALL be redirected to **`/login`**.

#### Scenario: Detail renders for valid expense id

- **WHEN** an authenticated user navigates to `/transactions/T1`
- **AND** T1 exists as an active expense transaction
- **THEN** the expense transaction detail page renders

#### Scenario: Unknown id shows not-found

- **WHEN** an authenticated user navigates to `/transactions/UNKNOWN`
- **AND** the workbook is connected
- **AND** no active expense transaction has id UNKNOWN
- **THEN** the user sees a not-found message
- **AND** a control or link is available to navigate to `/transactions`

#### Scenario: Income id shows not-found

- **WHEN** an authenticated user navigates to `/transactions/T9`
- **AND** T9 exists as an active transaction with type `income`
- **THEN** the user sees the same class of not-found handling as for unknown ids (not the expense detail layout)

### Requirement: Expense transaction detail header

On the expense transaction detail page, the system SHALL show at least **date**, **type** (as expense), **category**, **concept**, and **client** when `client_id` resolves to a client name (otherwise empty/placeholder consistent with the list). The **concept** field SHALL follow the same linking rules as the transactions table (including links to **`/jobs/:ref_id`** or **`/transactions/:transactionId`** for lot-backed expenses when those rules apply).

#### Scenario: Header mirrors list semantics

- **WHEN** user views expense detail for a transaction that has category, concept, and resolved client
- **THEN** those fields are visible with formatting consistent with the transactions table
- **AND** concept links behave per the existing transactions table requirement

### Requirement: Expense transaction detail totals and linked lots editing

The expense transaction detail page SHALL provide an editable **expense total** (negative expense convention) and, when lots exist, a bordered **linked lots** table whose columns are, in order: **material** (inventory display name as the visible text of a link to **`/inventory/:inventoryId`**), **quantity** (editable), **amount** (editable). The table SHALL NOT include a **purchase date** column. When there are no matching active lots, the section SHALL use a minimal empty presentation. The page SHALL provide **one** primary **Save changes** control that persists the expense **transaction amount** and **every linked lot’s quantity and amount** to the workbook using the same persistence model as other authenticated edits. The system SHALL show **live validation** while editing: invalid expense total, invalid lot quantity, or invalid lot amount (i18n). When at least one lot exists and all **lot amount** fields and the **expense total** parse as valid numbers, the system SHALL show a **visible warning** if the sum of lot amounts differs from **`|expense total|`** by more than **0.01**; in that case the **Save changes** control SHALL be **disabled** until totals align. When there are no lots, only the expense total is validated and persisted.

#### Scenario: Multi-lot purchase shows material links and saves

- **WHEN** an expense has multiple active lots across different inventory items
- **THEN** each row shows material link, editable quantity, and editable amount
- **AND** the user can save a consistent set of totals in one action

#### Scenario: No lots

- **WHEN** the expense has no active lots with matching `transaction_id`
- **THEN** the linked lots section shows a single clear empty state
- **AND** the user may still save the expense total alone

### Requirement: Transactions list opens expense detail

The **`/transactions`** view SHALL provide, for every **expense** row in the transactions table, at least one **keyboard-accessible** affordance (e.g. link on transaction id) that navigates to **`/transactions/:transactionId`** for that row’s id. **Income** rows SHALL NOT be required to expose this affordance. The transactions table SHALL remain without in-row edit/add/delete for other fields (read-only table requirement unchanged).

#### Scenario: Expense row has link to detail

- **WHEN** the transactions table shows an expense with id `T5`
- **THEN** the user can activate an affordance that navigates to `/transactions/T5`

#### Scenario: Income row has no expense-detail affordance

- **WHEN** the transactions table shows an income row
- **THEN** no navigation targeting `/transactions/:id` is required for that row as part of this requirement

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

The system SHALL support a pieces data model with fields: id (string), job_id (string, FK to jobs), name (string), status (enum: pending, done, failed), **units (optional positive integer; empty / unset when not yet specified)**, **price (number, optional, interpreted as currency per single unit when set)**, created_at (date).

#### Scenario: Piece linked to job

- **WHEN** a piece record exists
- **THEN** it has valid job_id referencing an existing job

### Requirement: Piece_items data model is defined

The system SHALL support a piece_items data model with fields: id (string), piece_id (string, FK to pieces), inventory_id (string, FK to inventory), quantity (number).

#### Scenario: Piece_item links piece to inventory

- **WHEN** a piece_item record exists
- **THEN** it connects a piece to an inventory item with a quantity consumed

### Requirement: piece_item inventory_id uniqueness per piece

The system SHALL reject creating a new `piece_item` when an **active** piece_item already exists for the same `piece_id` and `inventory_id` (archived and soft-deleted lines SHALL NOT count as blocking). The user SHALL see an i18n validation error and no row SHALL be appended.

#### Scenario: Second BOM line for same inventory is rejected

- **WHEN** piece `P1` already has an active piece_item with `inventory_id` `INV1`
- **AND** the user submits `CreatePieceItemPopup` for `P1` choosing `INV1` again
- **THEN** validation fails with an i18n message
- **AND** no new piece_item row is appended

### Requirement: Piece row shows units and full-run stock margin

The main piece row in `PiecesTable` (job detail and any other surface using the same table) SHALL expose an editable or commit-on-blur control for **`units`** (positive integer when set). When `units` is unset (empty), the row SHALL participate in **incomplete** highlighting defined for job detail. When `units` is set and the piece has exactly one piece_item for a given inventory line used in margin (per uniqueness rule), the row SHALL show a **full-run** stock margin indicator for that material using `need_run = piece_item.quantity × units` compared to `qty_current` on the inventory item, using the same safe / tight / risky band thresholds as piece_item redo margin (`floor((qty_current - need_run) / need_run)` with the same numeric thresholds for labels). When multiple inventory lines exist on one piece, the system SHALL show one indicator per distinct `inventory_id` or a compact summary defined in implementation as long as each line’s full-run risk is visible without contradicting uniqueness.

#### Scenario: Full-run margin reflects units multiplier

- **WHEN** a piece has `units` 150 and a piece_item requiring 2g from inventory with `qty_current` 500g
- **THEN** the piece-row full-run margin uses `need_run` = 300g in the margin calculation

### Requirement: Piece consuming status requires units

The system SHALL NOT apply inventory decrement for a transition to `done` or `failed` when the piece’s **`units`** field is unset or not a positive finite integer; the user SHALL see an i18n error and the status SHALL NOT change.

#### Scenario: Done blocked without units

- **WHEN** the user attempts to set a piece to `done` with at least one piece_item
- **AND** `units` is empty
- **THEN** the operation is blocked with an i18n error
- **AND** inventory is not modified

### Requirement: fetchPieces and usePieces read pieces sheet

The system SHALL provide `fetchPieces(spreadsheetId)` that reads all rows from the `pieces` sheet via `SheetsRepository`, filters out rows without `id`, parses `status` as a piece status, **parses optional `units` as a positive integer or undefined if empty**, **parses optional `price` as a number or undefined if empty (per-unit quote)**, and returns `Piece` objects sorted by `created_at` descending. The system SHALL provide `usePieces(spreadsheetId)` using TanStack Query with query key `['pieces', spreadsheetId]`, following the same enabled/null pattern as `useJobs`.

#### Scenario: Hooks load when spreadsheet is available

- **WHEN** `usePieces` is used with a non-null spreadsheet id
- **THEN** data is fetched from the pieces sheet through `fetchPieces`

### Requirement: fetchPieceItems and usePieceItems read piece_items sheet

The system SHALL provide `fetchPieceItems(spreadsheetId)` that reads all rows from the `piece_items` sheet, filters rows without `id`, parses `quantity` as a number, and returns `PieceItem` objects. The system SHALL provide `usePieceItems(spreadsheetId)` with query key `['piece_items', spreadsheetId]`, following the same pattern as `usePieces`.

#### Scenario: Piece items available for grouping by piece

- **WHEN** `fetchPieceItems` completes successfully
- **THEN** each returned object includes `piece_id`, `inventory_id`, and numeric `quantity`

### Requirement: Piece rows expand to show piece_items

The system SHALL allow the user to expand a piece row to view a nested list of that piece's `piece_items`. The nested list SHALL show: piece_item id, inventory item name (resolved from the inventory sheet), quantity, **material cost** (quantity × avg unit cost from active lots for that `inventory_id` when computable; otherwise a placeholder such as em dash), remaining quantity (`qty_current` on the inventory item), and redo margin. The redo margin for each **nested** piece_item SHALL be calculated **for a single manufactured unit only** using that line’s `quantity` as: `floor((qty_current - quantity) / quantity)` and displayed with a label: "safe" (2+ redos, green), "tight" (1 redo, yellow), or "risky" (0 redos, red). The nested section SHALL include a control to add a new piece_item to that piece. Collapsing a row SHALL hide its nested list.

#### Scenario: User expands a piece with lines

- **WHEN** the user expands a piece that has piece_items
- **THEN** each related piece_item appears with inventory name, quantity, **material cost**, remaining quantity, and redo margin indicator

#### Scenario: Material cost column formats currency when computable

- **WHEN** a piece_item references an inventory item with active lots yielding a defined avg unit cost
- **THEN** the material cost cell shows currency-formatted `quantity × avg_unit_cost`

#### Scenario: Piece_item shows risky redo margin

- **WHEN** a piece_item requires 450g **per unit** and the lot has 500g remaining
- **THEN** the redo margin shows "tight (1 redo)" in yellow

#### Scenario: Piece_item shows safe redo margin

- **WHEN** a piece_item requires 42g **per unit** and the lot has 916g remaining
- **THEN** the redo margin shows "safe (21 redos)" in green

### Requirement: CreatePiecePopup creates a piece for a selected job

The system SHALL provide `CreatePiecePopup` that collects a required piece name **and optional per-unit piece price (number, 0 allowed)**. **`units` SHALL default to unset (empty) on create** and MAY be edited later from the pieces table. When opened from a context without a fixed job, the popup SHALL also collect a required job via a searchable list from cached jobs data (same interaction pattern as `CreateJobPopup` client picker). When opened from a job detail page, the job SHALL be fixed to that job and the job picker SHALL NOT be shown. On successful submit, the system SHALL call `createPiece` to append a row with generated `P`-prefixed id, `status` `pending`, **optional per-unit price**, **empty `units`**, and current ISO timestamp for `created_at`. The popup SHALL be closable without saving. All user-visible strings SHALL use i18n (English and Spanish).

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

The system SHALL provide `createPiece(spreadsheetId, { job_id, name, price? })` that generates the next `P`-prefixed id from existing piece ids, and appends one row to the `pieces` sheet with `status` `pending`, **`price` if provided (per-unit)**, **`units` left empty for the user to set later from the pieces table**, and `created_at` set to the current time in ISO-8601 format.

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

The system SHALL provide `createPieceItem(spreadsheetId, { piece_id, inventory_id, quantity })` that generates the next `PI`-prefixed id from existing piece_item ids and appends one row linking the piece, inventory item, and quantity **only when no active piece_item exists for the same `piece_id` and `inventory_id`**; otherwise it SHALL return a validation error without appending.

#### Scenario: Id increments after existing piece_items

- **WHEN** piece_items `PI1` and `PI2` already exist
- **AND** `createPieceItem` is invoked
- **THEN** the appended row has id `PI3`

#### Scenario: Duplicate inventory_id for same piece is rejected

- **WHEN** an active piece_item already exists for `piece_id` `P1` and `inventory_id` `INV1`
- **AND** `createPieceItem` is invoked again for `P1` and `INV1`
- **THEN** the function returns a validation error
- **AND** no new row is appended

### Requirement: Piece status is changeable via dropdown

The system SHALL display a `PieceStatusDropdown` component in `PiecesTable` for each piece row, replacing the plain text status display. The dropdown SHALL list all `PieceStatus` values (`pending`, `done`, `failed`) with i18n labels. Changing the dropdown value SHALL trigger a confirmation flow before updating the piece status.

#### Scenario: User changes piece status to done

- **WHEN** the user selects "done" from the piece status dropdown
- **THEN** a confirmation dialog is shown before the status is updated

#### Scenario: Status dropdown is disabled during update

- **WHEN** a piece status update is in progress
- **THEN** the dropdown for that piece is disabled

### Requirement: Confirmation dialog shown before consuming status transition

The system SHALL show a `ConfirmDialog` when piece status changes to `done` or `failed`. The dialog SHALL contain a pre-checked checkbox labeled "Decrement from inventory" (i18n). Stock sufficiency SHALL be evaluated using **effective consumption per inventory id**: the sum of **`piece_item.quantity × piece.units`** for all piece_items of that piece referencing that inventory id (with `piece.units` required to be set and positive per "Piece consuming status requires units"). If all referenced inventory items have sufficient `qty_current` for those effective amounts, the dialog SHALL show a standard confirmation message. If any inventory item has insufficient stock, the dialog SHALL show a warning message identifying the insufficient items but SHALL NOT block confirmation — the user MAY uncheck the decrement checkbox and proceed, or cancel.

#### Scenario: Sufficient stock shows standard confirmation

- **WHEN** user selects "done" for a piece with piece_items and set `units`
- **AND** all referenced inventory items have sufficient qty_current for effective consumption
- **THEN** dialog shows with pre-checked "Decrement from inventory" checkbox
- **AND** confirm button is enabled

#### Scenario: Insufficient stock shows warning but allows proceed

- **WHEN** user selects "done" for a piece with piece_items and set `units`
- **AND** at least one referenced inventory item has insufficient qty_current for effective consumption
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
- **THEN** each inventory item's `qty_current` is incremented by the **effective consumption** (`piece_item.quantity × units`) that was subtracted when the piece entered `done` or `failed`
- **AND** piece status is updated to "pending"

### Requirement: updatePieceStatus service orchestrates status and inventory

The system SHALL provide `updatePieceStatus(spreadsheetId, piece, newStatus, options)` that:
1. Reads the pieces sheet to find the piece's row index.
2. Reads piece_items filtered by piece_id.
3. Reads inventory sheet.
4. If `decrementInventory` is true and new status is `done` or `failed`: validates the piece has **set positive integer `units`**, validates all inventory items have sufficient `qty_current` for **effective need** (sum of **`piece_item.quantity × units`** per `inventory_id`), then decrements each inventory item's `qty_current` by that effective amount via `updateRow`.
5. If `restoreInventory` is true and old status was `done` or `failed` and new status is `pending`: increments each inventory item's `qty_current` by the same **effective need** computed from the piece’s piece_items and `units` at transition time via `updateRow`.
6. Updates the piece row status via `updateRow`.

The function SHALL return an error result (not throw) when validation fails, including details of which inventory items are insufficient.

#### Scenario: Successful decrement updates inventory and piece

- **WHEN** `updatePieceStatus` is called with `decrementInventory: true` for status "done"
- **AND** the piece has `units` 10 and piece_items that imply effective needs all covered by stock
- **THEN** each referenced inventory item's `qty_current` is decremented by the effective amounts
- **AND** the piece row status is updated to "done"

#### Scenario: Validation failure returns error details

- **WHEN** `updatePieceStatus` is called with `decrementInventory: true`
- **AND** effective need for INV1 exceeds its `qty_current`
- **THEN** the function returns an error result identifying INV1 as insufficient
- **AND** no sheet rows are modified

#### Scenario: Restore increments inventory

- **WHEN** `updatePieceStatus` is called with `restoreInventory: true` moving from "done" to "pending"
- **THEN** each referenced inventory item's `qty_current` is incremented by the same effective amounts that were subtracted when the piece entered a consuming status
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

The happy-path fixture data SHALL include pieces with realistic statuses and inventory quantities that reflect consumption. At least one piece SHALL have status `done` with piece_items, **set positive `units`**, and the referenced inventory item's `qty_current` SHALL be decremented by the **sum of (piece_item.quantity × units)** for those piece_items.

#### Scenario: Fixture inventory reflects completed piece

- **WHEN** fixture piece P3 has status "done" with piece_item PI3 consuming 15g per unit from INV1 and `units` 1
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

The system SHALL surface a **suggested** **per-unit** price for a piece derived from BOM material cost **for one manufactured unit**. For a given piece, the material subtotal SHALL be the sum of every `piece_item` on that piece: `piece_item.quantity × avg_unit_cost`, where `avg_unit_cost` for the referenced inventory item is `Σ(lot.amount) / Σ(lot.quantity)` across all active lots for that inventory_id. All `InventoryType` values (`filament`, `consumable`, `equipment`) SHALL use the same rule. The suggested **per-unit** price SHALL be the material subtotal multiplied by **3** (hardcoded). Applying the suggestion SHALL write the piece’s **`price`** field as that **per-unit** value (not multiplied by `units`).

When a piece has **no** `piece_items`, the system SHALL **not** render the suggestion for that piece.

When **any** `piece_item` references an inventory item that has no active lots or whose `avg_unit_cost` cannot be computed (missing inventory row, no lots, or total quantity not strictly greater than zero), the system SHALL show an error state listing affected inventory items.

The displayed suggestion SHALL **recompute** when inputs change (including after workbook refresh or invalidation of pieces, piece_items, lots, or inventory).

#### Scenario: Per-piece BOM suggestion shown

- **WHEN** a piece has piece_items referencing inventory items with lots
- **THEN** the suggestion shows material subtotal and suggested **per-unit** price (subtotal × 3) for that piece

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

The system SHALL create an income transaction when a job status changes to "paid" **by default**, via the `updateJobStatus` service when income creation is not disabled. The transaction SHALL have type "income", amount equal to **derived total** (per `job-management`: sum over counting pieces of **`units × price`** when both are set for each piece, with the same inclusion rules for archived/deleted pieces as that capability), and reference the job. **Derived total** MAY be 0 when all line revenues are zero. When a transaction is created, `updateJobStatus` SHALL update the job row and append the transaction in a single logical operation. The transition to paid SHALL be **rejected** if any counting piece has **unset** `price` **or unset `units`** (see `job-management` paid gating). The user MAY opt out via the jobs UI (e.g. unchecked "create income transaction" on the paid confirmation dialog); when opted out, the job row SHALL still update to "paid" but **no** new transaction row SHALL be appended. Leaving "paid" and entering "paid" again later without opt-out MAY append another income transaction; the UI SHALL confirm before leaving "paid" to reduce duplicate risk.

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

The system SHALL provide a way to persist an optional **`price`** on an existing piece representing **currency per single unit** (e.g. `updatePiece` or dedicated `updatePiecePrice`) in the workbook store, validating numeric input and preserving other piece fields including **`units`**.

#### Scenario: Price update writes pieces sheet

- **WHEN** the user saves a new per-unit price for piece "P1"
- **THEN** the pieces matrix row for P1 reflects the updated `price` after save

### Requirement: UI strings support i18n

All user-facing strings in the transactions view SHALL use i18next for translation support.

#### Scenario: Table headers are translatable

- **WHEN** transactions table renders
- **THEN** column headers come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown
- **THEN** message comes from i18n keys
