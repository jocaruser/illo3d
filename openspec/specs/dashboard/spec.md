# dashboard Specification

## Purpose

Define the authenticated **Dashboard** landing page at `/dashboard`: summary metrics, jobs kanban, inventory alerts, recent activity, quick actions, and i18n.

## Requirements

### Requirement: Dashboard page at /dashboard route

The system SHALL provide a `/dashboard` route protected by the same authentication guard as other data pages. The route SHALL be the default landing destination for authenticated users with an active shop (replacing `/transactions` as the root redirect target). The page SHALL render only when `workbookStatus === 'ready'`, and SHALL show `ConnectionStatus` on error with a retry handler, consistent with all other data pages.

#### Scenario: Authenticated user lands on dashboard after login

- **WHEN** an authenticated user with an active shop navigates to `/`
- **THEN** they are redirected to `/dashboard`

#### Scenario: Dashboard renders when workbook is ready

- **WHEN** user navigates to `/dashboard` and workbook status is `ready`
- **THEN** all dashboard widgets are visible

#### Scenario: Dashboard shows connection status on error

- **WHEN** user navigates to `/dashboard` and workbook status is `error`
- **THEN** the `ConnectionStatus` component is shown with a retry option

#### Scenario: Dashboard route is protected

- **WHEN** an unauthenticated user navigates to `/dashboard`
- **THEN** the system redirects to `/login`

---

### Requirement: Jobs kanban on dashboard

The system SHALL display a kanban board on the dashboard with one column per `JobStatus` value (`draft`, `in_progress`, `delivered`, `paid`, `cancelled`). Each card SHALL show the job description, client name, and price (when set). Cards SHALL link to `/jobs/:id`. The `cancelled` column SHALL display at most 10 cards with a link to `/jobs` to view all. Archived and deleted jobs SHALL be excluded.

#### Scenario: Kanban shows all status columns

- **WHEN** user views the dashboard
- **THEN** columns for `draft`, `in_progress`, `delivered`, `paid`, and `cancelled` are visible

#### Scenario: Kanban card links to job detail

- **WHEN** user clicks a kanban card
- **THEN** they are navigated to `/jobs/:id` for that job

#### Scenario: Cancelled column is capped at 10 cards

- **WHEN** more than 10 cancelled jobs exist
- **THEN** only 10 are shown in the kanban column with a link to view all at `/jobs`

#### Scenario: Empty column shows placeholder

- **WHEN** a status column has no jobs
- **THEN** the column shows a localized empty state message

---

### Requirement: Summary stat cards on dashboard

The system SHALL display three summary stat cards: current balance (sum of all active transactions), active jobs count (jobs with status `draft` or `in_progress`), and revenue this month (sum of `income` transactions whose `date` falls within the current calendar month). All values SHALL use the same formatting utilities (`formatCurrency`, `calculateBalance`) used elsewhere in the app.

#### Scenario: Balance card shows calculated balance

- **WHEN** user views the dashboard
- **THEN** the balance card displays the result of `calculateBalance` over active transactions

#### Scenario: Active jobs count reflects draft and in-progress only

- **WHEN** user views the dashboard
- **THEN** the active jobs count includes only jobs with status `draft` or `in_progress`

#### Scenario: Revenue this month sums income transactions in current month

- **WHEN** user views the dashboard
- **THEN** the revenue card shows the total of income transactions dated within the current calendar month

---

### Requirement: Dashboard expected benefit widget

The dashboard SHALL display a widget titled per i18n that shows **expected benefit** for in-scope work: **sum of (line revenue − material cost at avg lot cost)** across **active jobs** (`draft` or `in_progress`) and their **counting pieces** where **`units` and `price` are set**, piece has at least one piece_item, and every referenced inventory line has computable avg unit cost. **Line revenue** SHALL be `units × price`. **Material cost for the piece** SHALL be `units ×` (sum of `piece_item.quantity × avg_unit_cost` per line). When no qualifying pieces exist, the widget SHALL show a neutral empty state (i18n). When some pieces qualify and others lack data, the widget SHALL sum only qualifying pieces **or** show an incomplete state per implementation choice documented in tasks, but SHALL NOT show a false exact total without disclosure.

#### Scenario: Widget shows positive benefit

- **WHEN** at least one in-progress job has a piece with `units` 10, `price` 5, and BOM costs implying material 20 for the full run
- **AND** all needed avg unit costs are defined
- **THEN** the widget includes that piece’s contribution (10×5 − 20 = 30) in the displayed total

#### Scenario: No qualifying data

- **WHEN** no active job has a fully computable piece
- **THEN** the widget shows the empty state without a numeric benefit

---

### Requirement: Inventory alert widget on dashboard

The system SHALL display an inventory alert widget showing items below stock thresholds using the same tier logic as `InventoryTable`: items with `qty_current / qty_initial ≤ 0.3` (and `qty_initial > 1`). Items with ratio ≤ 0.1 SHALL be shown as critical (red), items with ratio > 0.1 and ≤ 0.3 as low stock (orange/yellow). The widget SHALL link each item to `/inventory`. Archived and deleted inventory rows SHALL be excluded.

#### Scenario: Critical items appear in alert widget

- **WHEN** an inventory item has `qty_current / qty_initial ≤ 0.1` and `qty_initial > 1`
- **THEN** the item appears in the inventory alert widget with critical styling

#### Scenario: Low-stock items appear in alert widget

- **WHEN** an inventory item has ratio > 0.1 and ≤ 0.3 and `qty_initial > 1`
- **THEN** the item appears in the inventory alert widget with warning styling

#### Scenario: No alerts when all stock is healthy

- **WHEN** all inventory items have ratio > 0.3 or `qty_initial ≤ 1`
- **THEN** the inventory alert widget shows a localized "all stock healthy" message

---

### Requirement: Recent transactions on dashboard

The system SHALL display the 5 most recent active transactions on the dashboard, ordered by `date` descending. Each row SHALL show: date, concept label, and amount. The concept label SHALL follow the same linking rules as the transactions table concept column: when a transaction has `ref_type` `job` and a non-empty `ref_id`, the label SHALL be a link to `/jobs/:ref_id` with visible text equal to the concept string; when the transaction type is `expense` and the transaction has linked lots (matched via `lots.transaction_id`), the label SHALL be a link to `/inventory` or to `/inventory/:id` when the UI resolves a single inventory id the same way as on the transactions page; otherwise the label SHALL be plain text only. The widget SHALL include a control to view the full ledger that navigates to `/transactions`.

#### Scenario: Recent transactions shows last 5

- **WHEN** user views the dashboard and active transactions exist
- **THEN** at most the 5 most recent transactions by date appear in the recent transactions widget

#### Scenario: View all navigates to transactions

- **WHEN** user activates the view-all control on the recent transactions widget
- **THEN** the app navigates to `/transactions`

#### Scenario: Job-backed concept links to job

- **WHEN** a displayed row is a transaction with `ref_type` `job` and non-empty `ref_id`
- **THEN** the concept label is a link to `/jobs/:ref_id` whose visible text is the concept string

#### Scenario: Lot-backed expense concept links toward inventory

- **WHEN** a displayed row is an expense transaction with at least one linked lot
- **THEN** the concept label is a link to inventory consistent with the transactions table (including specific inventory id when resolved)

#### Scenario: No link when rules do not apply

- **WHEN** a displayed row is a transaction that is not job-backed per link rules and not a lot-backed expense
- **THEN** the concept label is plain text with no link

#### Scenario: No separate recent spending widget

- **WHEN** user views the dashboard with workbook ready
- **THEN** the system does not show a second widget whose purpose is only recent expenses or "recent spending" distinct from the recent transactions widget

---

### Requirement: Pieces completed this week on dashboard

The system SHALL display a count of pieces with `status = 'done'` whose `created_at` falls within the last 7 calendar days.

#### Scenario: Pieces completed counter reflects last 7 days

- **WHEN** user views the dashboard
- **THEN** the counter shows the number of pieces with `status = done` created in the last 7 days

---

### Requirement: Quick-action CTAs on dashboard

The system SHALL provide two quick-action call-to-action buttons on the dashboard: one to create a new expense (opens `CreateExpensePopup`) and one to create a new job (opens `CreateJobPopup`). These SHALL behave identically to the same controls on `TransactionsPage` and `JobsPage` respectively.

#### Scenario: Add expense CTA opens expense popup

- **WHEN** user clicks the add expense CTA on the dashboard
- **THEN** the `CreateExpensePopup` opens

#### Scenario: Add job CTA opens job popup

- **WHEN** user clicks the add job CTA on the dashboard
- **THEN** the `CreateJobPopup` opens

---

### Requirement: Dashboard UI strings support i18n

All user-facing strings on the dashboard SHALL use i18next keys under a `dashboard.*` namespace, with translations for both English and Spanish.

#### Scenario: Dashboard labels are translatable

- **WHEN** the UI locale is Spanish
- **THEN** all dashboard widget titles, stat labels, and empty states display Spanish translations
