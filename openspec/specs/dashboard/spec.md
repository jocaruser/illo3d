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

### Requirement: Recent transactions and expenses on dashboard

The system SHALL display the 5 most recent active transactions and the 5 most recent active expenses on the dashboard, ordered by `date` descending. Each row SHALL show: date, description/name, and amount. The widgets SHALL include a link to `/transactions` and `/expenses` respectively to view the full list.

#### Scenario: Recent transactions shows last 5

- **WHEN** user views the dashboard and active transactions exist
- **THEN** the 5 most recent transactions are shown in the recent transactions widget

#### Scenario: Recent expenses shows last 5

- **WHEN** user views the dashboard and active expenses exist
- **THEN** the 5 most recent expenses are shown in the recent expenses widget

#### Scenario: Recent transactions widget links to full ledger

- **WHEN** user clicks the "view all" link in the recent transactions widget
- **THEN** they are navigated to `/transactions`

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
