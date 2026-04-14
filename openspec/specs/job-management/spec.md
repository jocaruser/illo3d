# job-management Specification

## Purpose

Jobs table page with domain services for creating and managing print jobs: `/jobs` route, optional job detail at `/jobs/:jobId` (summary plus pieces for that job), table with inline status transitions, confirmation dialogs for financial and destructive actions, create popup with searchable client selector, UI-agnostic domain layer, and i18n for all job UI strings.

## Requirements

### Requirement: Jobs page displays job table

The system SHALL provide a `/jobs` route protected by the same authentication guard as other data pages. The route SHALL display a table of all jobs from the jobs sheet. The table SHALL show: id, client name (resolved from client_id), description, status, price (formatted as €), and created_at. The table SHALL be sorted by created_at descending.

#### Scenario: Jobs table renders with data

- **WHEN** authenticated user navigates to `/jobs`
- **AND** jobs exist in the sheet
- **THEN** table displays all jobs with id, client name, description, status, price, and created_at columns
- **AND** jobs are sorted by created_at descending

#### Scenario: Empty state shown when no jobs

- **WHEN** authenticated user navigates to `/jobs`
- **AND** no jobs exist in the sheet
- **THEN** page shows an empty state message

#### Scenario: Jobs route is protected

- **WHEN** an unauthenticated user navigates to `/jobs`
- **THEN** the system redirects to `/login`

#### Scenario: Client name is resolved from client_id

- **WHEN** a job has client_id "CL1"
- **AND** client CL1 has name "Alice"
- **THEN** the table displays "Alice" in the client column

### Requirement: Jobs page shows connection status

The system SHALL display the sheets connection status on the jobs page. The page SHALL connect to the spreadsheet on mount and show connecting, connected, or error states using the `ConnectionStatus` component.

#### Scenario: Connection status while connecting

- **WHEN** the jobs page loads
- **THEN** the connection status indicator is visible while connecting

#### Scenario: Table shown after connected

- **WHEN** connection succeeds
- **THEN** the jobs table (or empty state) is displayed

#### Scenario: Error with retry on connection failure

- **WHEN** connection fails
- **THEN** an error message with retry option is displayed

### Requirement: Jobs page is accessible from app navigation

The system SHALL include a "Jobs" link in the app header navigation alongside the existing Clients, Transactions, Expenses, and Inventory links. The Jobs nav item SHALL remain active when the user is on a job detail path under `/jobs/…` (not only on `/jobs`).

#### Scenario: Jobs link in header

- **WHEN** user views any page with the app header
- **THEN** a "Jobs" link is visible in the navigation
- **AND** clicking it navigates to `/jobs`

### Requirement: Jobs table links to job detail

The jobs table SHALL render each job’s **id** in the id column as the visible text of a link to `/jobs/:jobId` for that id, so the user can open job details (including pieces) from the list. The system SHALL NOT use a separate column whose sole purpose is linking to job detail.

#### Scenario: Job id links to detail

- **WHEN** the jobs table displays a job with id "J1"
- **THEN** the id cell shows the link label "J1"
- **AND** activating the link navigates to `/jobs/J1`

### Requirement: StatusDropdown allows inline status changes

The system SHALL provide a `StatusDropdown` component that renders a `<select>` with all five job statuses (draft, in_progress, delivered, paid, cancelled) using i18n labels. The dropdown SHALL be a controlled component receiving the current status and an onChange callback.

#### Scenario: Dropdown shows current status

- **WHEN** a job row renders with status "draft"
- **THEN** the status dropdown shows "draft" as the selected value

#### Scenario: Dropdown lists all statuses

- **WHEN** user opens the status dropdown
- **THEN** all five statuses are available as options with localized labels

#### Scenario: Status change triggers callback

- **WHEN** user selects a new status from the dropdown
- **THEN** the onChange callback fires with the new status value

### Requirement: Confirmation dialog for paid transition

The system SHALL display a confirmation dialog when the user changes a job's status to "paid". If the job has a price set (including 0), the dialog SHALL display the price and ask for confirmation. If the job has no price (null/empty), the dialog SHALL require the user to enter a price before confirming. A price of 0 SHALL be valid (gifts). The dialog SHALL have confirm and cancel actions.

#### Scenario: Paid confirmation with existing price

- **WHEN** user changes status to "paid" on a job with price €45
- **THEN** a confirmation dialog appears showing "Mark as paid for €45.00?"
- **AND** user can confirm or cancel

#### Scenario: Paid confirmation requires price when missing

- **WHEN** user changes status to "paid" on a job with no price
- **THEN** a confirmation dialog appears with a price input field
- **AND** the confirm button is disabled until a valid price is entered
- **AND** 0 is accepted as a valid price

#### Scenario: Paid confirmation cancelled

- **WHEN** user cancels the paid confirmation dialog
- **THEN** the job status remains unchanged
- **AND** no transaction is created

### Requirement: Paid confirmation includes income transaction option

The paid confirmation dialog SHALL include a checkbox indicating whether to create an income transaction for the payment. The checkbox SHALL default to **checked**. Labels SHALL use i18n. When the user confirms with the checkbox checked, `updateJobStatus` SHALL run with default transaction behavior (append income). When the user confirms with the checkbox unchecked, `updateJobStatus` SHALL run with transaction creation disabled so the job updates to "paid" with the confirmed price but no new transaction row is appended.

#### Scenario: Income transaction checkbox defaults to checked

- **WHEN** the paid confirmation dialog opens
- **THEN** the "create income transaction" (or equivalent) checkbox is visible and checked by default

#### Scenario: Unchecked checkbox skips transaction append

- **WHEN** the user confirms paid with the income-transaction checkbox unchecked
- **THEN** the job row is updated to paid with the agreed price
- **AND** no new transaction is created

#### Scenario: Checked checkbox appends income transaction

- **WHEN** the user confirms paid with the income-transaction checkbox checked
- **THEN** an income transaction is appended as specified for job payment

### Requirement: Confirmation when leaving paid status

The system SHALL display a confirmation dialog before changing a job's status **from** "paid" **to** any other status (draft, in_progress, delivered, or cancelled). The dialog SHALL warn that marking the job paid again later may create duplicate income transactions if income was already recorded. The dialog SHALL reference the target status the user selected.

#### Scenario: Paid to in_progress requires confirmation

- **WHEN** user changes status from "paid" to "in_progress"
- **THEN** a confirmation dialog appears before the change is applied

#### Scenario: Leave-paid dialog dismissed

- **WHEN** user dismisses the leave-paid confirmation without confirming
- **THEN** the job remains "paid"

#### Scenario: Leave-paid confirmed applies new status

- **WHEN** user confirms leaving paid for a selected target status
- **THEN** the job row updates to that status

### Requirement: Confirmation dialog for cancelled transition

The system SHALL display the cancellation confirmation dialog when the user changes a job's status to "cancelled" **and** the job's current status is not "paid". When the current status is "paid", the transition to "cancelled" SHALL use only the leave-paid confirmation dialog (not a second cancellation dialog).

#### Scenario: Cancelled confirmation shown from non-paid status

- **WHEN** user changes status to "cancelled" from "draft", "in_progress", or "delivered"
- **THEN** a confirmation dialog appears asking to confirm cancellation

#### Scenario: Paid to cancelled uses leave-paid dialog only

- **WHEN** user changes status from "paid" to "cancelled"
- **THEN** only the leave-paid confirmation is shown
- **AND** the separate "cancel job" dialog is not shown afterward

#### Scenario: Cancelled confirmation accepted

- **WHEN** user confirms the cancellation dialog (from a non-paid status)
- **THEN** the job status changes to "cancelled"

#### Scenario: Cancelled confirmation rejected

- **WHEN** user cancels the cancellation dialog
- **THEN** the job status remains unchanged

### Requirement: Other status transitions require no confirmation

The system SHALL allow status changes between draft, in_progress, and delivered without confirmation dialogs. This requirement does not apply to transitions **from** "paid" (covered by leave-paid confirmation) or **to** "paid" or "cancelled" (covered by their respective dialogs).

#### Scenario: Draft to in_progress without confirmation

- **WHEN** user changes status from "draft" to "in_progress"
- **THEN** the status updates immediately without a confirmation dialog

#### Scenario: In_progress to delivered without confirmation

- **WHEN** user changes status from "in_progress" to "delivered"
- **THEN** the status updates immediately without a confirmation dialog

### Requirement: ConfirmDialog is a reusable component

The system SHALL provide a generic `ConfirmDialog` component that renders a modal with a title, message, optional children (for custom form fields like price input, income-transaction checkbox, etc.), and confirm/cancel buttons. The component SHALL be reusable for paid confirmation, leave-paid confirmation, cancelled confirmation, and future destructive actions.

#### Scenario: ConfirmDialog renders with title and message

- **WHEN** ConfirmDialog is rendered with title and message props
- **THEN** it displays the title, message, and confirm/cancel buttons

#### Scenario: ConfirmDialog supports custom children

- **WHEN** ConfirmDialog is rendered with children (e.g., price input)
- **THEN** the children render between the message and the buttons

#### Scenario: ConfirmDialog is closable

- **WHEN** user clicks cancel or the overlay
- **THEN** the onCancel callback fires

### Requirement: CreateJobPopup is a modal form

The system SHALL provide a `CreateJobPopup` component that renders a modal with a form. The form SHALL collect: client (required, searchable dropdown from cached client data), description (required, text input), and price (optional, number input where 0 is valid). The popup SHALL be closable via overlay click or cancel button.

#### Scenario: Popup opens and shows form fields

- **WHEN** user clicks "Add job" button
- **THEN** modal displays with client dropdown, description input, and price input

#### Scenario: Client dropdown is searchable

- **WHEN** user types in the client dropdown
- **THEN** the options filter to match the typed text
- **AND** no additional API calls are made

#### Scenario: Client is required

- **WHEN** user submits the form without selecting a client
- **THEN** a validation error is shown
- **AND** no job is created

#### Scenario: Description is required

- **WHEN** user submits the form with an empty description
- **THEN** a validation error is shown
- **AND** no job is created

#### Scenario: Price is optional and accepts zero

- **WHEN** user submits with a price of 0
- **THEN** the job is created with price 0

#### Scenario: Price accepts empty value

- **WHEN** user submits without entering a price
- **THEN** the job is created with no price (null)

#### Scenario: Popup can be closed without submitting

- **WHEN** user opens the popup
- **THEN** user can close it via overlay click or cancel button
- **AND** no job is created

#### Scenario: Successful submission creates job and refreshes table

- **WHEN** user fills in valid client and description and submits
- **THEN** a job record is appended to the jobs sheet with status "draft"
- **AND** the popup closes
- **AND** the jobs table refreshes to show the new job

### Requirement: Add job button on jobs page

The system SHALL display an "Add job" button on the `/jobs` page. Clicking the button SHALL open the CreateJobPopup.

#### Scenario: Button visible on jobs page

- **WHEN** user views `/jobs` and connection is established
- **THEN** "Add job" button is visible

#### Scenario: Button opens popup

- **WHEN** user clicks "Add job"
- **THEN** CreateJobPopup opens

### Requirement: createJob service appends job row

The system SHALL provide a `createJob` service that appends a row to the jobs sheet via the SheetsRepository. The service SHALL generate an auto-incrementing ID with "J" prefix (J1, J2, ...), set status to "draft", and set `created_at` to the current ISO date.

#### Scenario: Job row appended with generated ID

- **WHEN** createJob is called with client_id, description, and optional price
- **THEN** a row is appended to the jobs sheet with a "J"-prefixed ID, status "draft", and current date as created_at

#### Scenario: ID increments based on existing jobs

- **WHEN** jobs J1 and J2 already exist
- **AND** createJob is called
- **THEN** the new job gets ID J3

### Requirement: updateJobStatus service updates status and optional income transaction

The system SHALL provide an `updateJobStatus` service that updates a job's status in the jobs sheet. The service SHALL find the job's row by reading all jobs and matching by ID. If the new status is "paid", the service SHALL append an income transaction **unless** the caller passes an option to skip transaction creation (e.g. `createIncomeTransaction: false`). Omitting that option SHALL preserve default behavior (append income transaction).

#### Scenario: Status updated in jobs sheet

- **WHEN** updateJobStatus is called with job ID and new status
- **THEN** the job's row in the sheet is updated with the new status

#### Scenario: Paid status also updates price

- **WHEN** updateJobStatus is called with status "paid" and a price value
- **THEN** the job's row is updated with both the new status and the price

#### Scenario: Paid status creates income transaction by default

- **WHEN** updateJobStatus is called with status "paid" and transaction creation is not disabled
- **THEN** a transaction is appended with type "income", the job's price as amount, category "job", the job's description as concept, ref_type "job", ref_id as the job's ID, and the job's client_id

#### Scenario: Paid status skips transaction when opted out

- **WHEN** updateJobStatus is called with status "paid" and `createIncomeTransaction` is false
- **THEN** the job row is updated to paid
- **AND** no transaction row is appended

#### Scenario: Non-paid status does not create transaction

- **WHEN** updateJobStatus is called with status "in_progress"
- **THEN** no transaction is created

### Requirement: fetchJobs service reads job data

The system SHALL provide a `fetchJobs` service function that reads all rows from the jobs sheet via SheetsRepository, filters out rows without id, parses price as a number (or undefined if empty), and returns them sorted by created_at descending.

#### Scenario: Jobs fetched and parsed

- **WHEN** fetchJobs is called with a valid spreadsheetId
- **THEN** it returns an array of Job objects with price parsed as number

#### Scenario: Empty price is returned as undefined

- **WHEN** a job row has an empty price field
- **THEN** the Job object has price as undefined

### Requirement: useJobs hook provides reactive data

The system SHALL provide a `useJobs` hook using TanStack Query with key `['jobs', spreadsheetId]`. The hook SHALL follow the same pattern as `useClients` and `useExpenses`.

#### Scenario: Jobs data loads from sheet

- **WHEN** the jobs page mounts with a valid spreadsheet connection
- **THEN** job data is fetched from the jobs sheet via useJobs

### Requirement: SheetsRepository supports row updates

The system SHALL extend the `SheetsRepository` interface with an `updateRow(spreadsheetId, sheetName, rowIndex, row)` method. `rowIndex` SHALL be the 1-based data row index (row 1 = first data row after headers). All three repository implementations (Google, CSV, Local) SHALL implement this method.

#### Scenario: GoogleSheetsRepository updates row via API

- **WHEN** updateRow is called on GoogleSheetsRepository
- **THEN** it uses PUT to the Sheets API values endpoint to overwrite the specified row

#### Scenario: CsvSheetsRepository updates row via dev server

- **WHEN** updateRow is called on CsvSheetsRepository
- **THEN** it sends a PUT request to `/api/sheets/row` with the row data

#### Scenario: LocalSheetsRepository updates row via File System Access API

- **WHEN** updateRow is called on LocalSheetsRepository
- **THEN** it reads the CSV file, replaces the specified row, and writes the file back

### Requirement: Job UI strings support i18n

All user-facing strings on the jobs page (table headers, button labels, empty state, form labels, validation messages, status labels, confirmation dialog text including leave-paid and income-transaction checkbox labels) SHALL use i18next for translation support in both English and Spanish.

#### Scenario: Table headers are translatable

- **WHEN** jobs table renders
- **THEN** column headers come from i18n keys

#### Scenario: Status labels are translatable

- **WHEN** the status dropdown renders
- **THEN** status options display localized labels

#### Scenario: Form labels are translatable

- **WHEN** CreateJobPopup renders
- **THEN** field labels, buttons, and validation messages come from i18n keys

#### Scenario: Confirmation dialog text is translatable

- **WHEN** a confirmation dialog renders
- **THEN** title, message, and button labels come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown
- **THEN** message comes from i18n keys
