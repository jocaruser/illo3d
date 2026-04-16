# job-management Specification

## Purpose

Jobs table page with domain services for creating and managing print jobs: `/jobs` route, optional job detail at `/jobs/:jobId` (summary plus pieces for that job), table with inline status transitions, row-level edit and cascade archive, confirmation dialogs for financial and lifecycle actions, create/edit popup with searchable client selector, reusable `EntityDetailPage` layout for job detail header and actions, in-memory workbook mutations with explicit Save, and i18n for all job UI strings.

## Requirements

### Requirement: Jobs page displays job table

The system SHALL provide a `/jobs` route protected by the same authentication guard as other data pages. The route SHALL display a table of **active** jobs from the workbook store (`archived` and `deleted` not `"true"`). The table SHALL show: description (as the primary link to job detail), client name (resolved from client_id), status, **total**, and created_at. **Total** SHALL use **non-deleted** pieces for that job (**including** `archived: "true"`). If **every** such piece has a **set** `price`, **total** SHALL be the sum (formatted as €), including zeros. If **any** such piece has **unset** `price`, the **total** cell SHALL **not** show a single misleading currency-only value (e.g. show an incomplete placeholder or label per i18n). The incomplete-pricing label SHALL use **visually distinct** styling (e.g. highlighted badge: colored background and border) so it is not mistaken for a monetary amount. The system SHALL NOT show a separate id-only column. Until the user changes sort via column-header (or equivalent) controls, the table SHALL order rows by `created_at` descending with stable secondary ordering by job `id` when timestamps tie. The table SHALL provide the shared list discovery controls (search, fuzzy matching, sortable data columns, responsive column visibility) defined in the `list-table-discovery` capability. The **client name** cell SHALL be the visible text of a link to `/clients/:clientId` for that job’s `client_id`.

#### Scenario: Jobs table renders with data

- **WHEN** authenticated user navigates to `/jobs`
- **AND** active jobs exist in the workbook store
- **THEN** table displays those jobs with description (link), client name, status, **total**, and created_at columns
- **AND** jobs are ordered by `created_at` descending before any user sort change

#### Scenario: Empty state shown when no active jobs

- **WHEN** authenticated user navigates to `/jobs`
- **AND** no active jobs exist in the workbook store
- **THEN** page shows an empty state message

#### Scenario: Jobs route is protected

- **WHEN** an unauthenticated user navigates to `/jobs`
- **THEN** the system redirects to `/login`

#### Scenario: Client name is resolved from client_id

- **WHEN** a job has client_id "CL1"
- **AND** client CL1 has name "Alice"
- **THEN** the table displays "Alice" in the client column

#### Scenario: Client name links to client detail

- **WHEN** a job has client_id "CL1"
- **THEN** the client column activates a link to `/clients/CL1`

### Requirement: Jobs list shows linked tags in an instant tooltip

On the jobs table, when a job has linked tags, hovering or focusing the job description link (to job detail) SHALL show a custom tooltip (not the native `title` attribute alone) that appears without intentional browser delay, lists tag names in a readable layout, exposes an accessible name for screen readers, and does not clip inside the table scroll container (e.g. via fixed positioning or portal). Jobs without tags SHALL keep a plain description link without a tag tooltip.

#### Scenario: Tooltip shows tag labels on hover for a job

- **WHEN** the user hovers the description link for a job that has tag links
- **THEN** a tooltip becomes visible immediately and includes the linked tag names

### Requirement: Jobs page is accessible from app navigation

The system SHALL include a "Jobs" link in the app header navigation alongside the existing Clients, Transactions, Expenses, and Inventory links. The Jobs nav item SHALL remain active when the user is on a job detail path under `/jobs/…` (not only on `/jobs`).

#### Scenario: Jobs link in header

- **WHEN** user views any page with the app header
- **THEN** a "Jobs" link is visible in the navigation
- **AND** clicking it navigates to `/jobs`

### Requirement: Jobs table links to job detail

The jobs table SHALL render each job’s **description** (trimmed) as the visible text of a link to `/jobs/:jobId` when the description is non-empty; when the description is empty, the visible link text MAY fall back to the job **id**. The system SHALL NOT use a separate id-only column for navigation to job detail.

#### Scenario: Job description links to detail

- **WHEN** the jobs table displays a job with id "J1" and a non-empty description
- **THEN** the description cell shows a link whose visible text is the description
- **AND** activating the link navigates to `/jobs/J1`

### Requirement: Jobs table has actions column with edit and archive

The jobs table SHALL display an "Actions" column (right-aligned) with Edit and **Archive** buttons for each active job row. The Edit button SHALL open the job popup in edit mode. The Archive button SHALL open a cascade-archive confirmation dialog. The actions column SHALL follow the same layout pattern as the clients table actions column. All labels SHALL use i18n.

#### Scenario: Each row displays Edit and Archive actions

- **WHEN** the jobs table renders active job rows
- **THEN** each row displays Edit and Archive action buttons in a right-aligned actions column

#### Scenario: Edit button opens popup in edit mode

- **WHEN** user clicks Edit on a job row
- **THEN** the job popup opens pre-filled with that job's description and client (**not** a job-level price field)

#### Scenario: Archive button opens confirmation dialog

- **WHEN** user clicks Archive on a job row
- **THEN** a confirmation dialog appears warning that the job and its children will be archived

### Requirement: Jobs table shows only active jobs

The jobs table SHALL show only jobs where `archived` is not `"true"` and `deleted` is not `"true"`. Archived and soft-deleted jobs SHALL be excluded from the default list view.

#### Scenario: Archived jobs not shown

- **WHEN** authenticated user visits `/jobs`
- **THEN** jobs with `archived: "true"` are not displayed

#### Scenario: Soft-deleted jobs not shown

- **WHEN** authenticated user visits `/jobs`
- **THEN** jobs with `deleted: "true"` are not displayed

### Requirement: Job detail embedded children tables show all children including archived

The job detail page's embedded tables (pieces, notes, etc.) SHALL show **all children** for that job, regardless of lifecycle state. Active children render normally. Archived children render with **strikethrough styling** and offer only **Un-archive**. Soft-deleted children render with strikethrough and display **"Deleted entity"** (i18n) as the name.

#### Scenario: Archived piece visible in job detail pieces table

- **WHEN** a job has an archived piece
- **AND** the user views the job detail page
- **THEN** the archived piece appears with strikethrough styling
- **AND** Un-archive action is available, Edit is not

#### Scenario: Soft-deleted piece in job detail

- **WHEN** a job has a soft-deleted piece
- **AND** the user views the job detail page
- **THEN** the soft-deleted piece appears with strikethrough and "Deleted entity" label

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

The system SHALL **not** allow a job's status to change to "paid" while **any** **non-deleted** piece for that job (**including** archived pieces) has an **unset** `price` (empty / null). **Explicit numeric 0** counts as set. When all such pieces have a set price, let **derived total** be the sum of their `price` values (zeros included). When the user changes status to "paid" and gating passes, the system SHALL display a confirmation dialog showing **derived total** (including €0.00) and ask for confirmation. The dialog SHALL **not** include a separate payment-amount field to override or split across pieces. The dialog SHALL have confirm and cancel actions.

#### Scenario: Paid confirmation with positive derived total

- **WHEN** user changes status to "paid" on a job whose counting pieces all have set prices summing to €45
- **THEN** a confirmation dialog appears showing "Mark as paid for €45.00?" (or equivalent i18n)
- **AND** user can confirm or cancel

#### Scenario: Paid blocked when any piece price unset

- **WHEN** user changes status to "paid" on a job that has at least one non-deleted piece with unset `price`
- **THEN** the status does **not** change to paid
- **AND** the user sees an error explaining that all piece prices must be set (i18n)

#### Scenario: Paid confirmation with all prices zero

- **WHEN** user changes status to "paid" on a job whose counting pieces all have price **0** (set)
- **THEN** a confirmation dialog appears showing €0.00 (or equivalent)
- **AND** user can confirm or cancel

#### Scenario: Paid confirmation cancelled

- **WHEN** user cancels the paid confirmation dialog
- **THEN** the job status remains unchanged
- **AND** no transaction is created

### Requirement: Paid confirmation includes income transaction option

The paid confirmation dialog SHALL include a checkbox indicating whether to create an income transaction for the payment. The checkbox SHALL default to **checked**. Labels SHALL use i18n. When the user confirms with the checkbox checked, `updateJobStatus` SHALL run with default transaction behavior (append income). When the user confirms with the checkbox unchecked, `updateJobStatus` SHALL run with transaction creation disabled so the job updates to "paid" with **derived total** as the logical payment amount but no new transaction row is appended.

#### Scenario: Income transaction checkbox defaults to checked

- **WHEN** the paid confirmation dialog opens
- **THEN** the "create income transaction" (or equivalent) checkbox is visible and checked by default

#### Scenario: Unchecked checkbox skips transaction append

- **WHEN** the user confirms paid with the income-transaction checkbox unchecked
- **THEN** the job row is updated to paid
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

The system SHALL provide a `CreateJobPopup` component that renders a modal with a form. The form SHALL collect: client (required, searchable dropdown from cached client data) and description (required, text input). The popup SHALL **not** include a job-level price field; pricing SHALL be edited per piece on job detail. The popup SHALL be closable via overlay click or cancel button. The component SHALL accept an optional `initialJob` prop (`Job`). When `initialJob` is provided, the popup SHALL operate in edit mode: the title SHALL use the edit job label, fields SHALL pre-fill from the job (**description and client only**), and submit SHALL call `updateJob` instead of `createJob`. The popup SHALL accept an optional `onUpdateJob` callback for optimistic-update integration.

#### Scenario: Popup opens and shows form fields

- **WHEN** user clicks "Add job" button
- **THEN** modal displays with client dropdown and description input
- **AND** no job-level price input is shown

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

#### Scenario: Popup can be closed without submitting

- **WHEN** user opens the popup
- **THEN** user can close it via overlay click or cancel button
- **AND** no job is created

#### Scenario: Successful submission creates job in memory

- **WHEN** user fills in valid client and description and submits
- **THEN** a job record is added to the workbook store with status "draft"
- **AND** the popup closes
- **AND** the jobs table shows the new job without a repository write

#### Scenario: Popup pre-fills in edit mode

- **WHEN** the popup opens with `initialJob` set to a job with description "Phone case" and client "CL2"
- **THEN** the description field shows "Phone case" and the client picker shows client CL2

#### Scenario: Edit mode uses update title

- **WHEN** the popup opens in edit mode
- **THEN** the popup title displays the edit job label (not the create label)

#### Scenario: Edit submission calls updateJob

- **WHEN** user edits description to "Lamp base" and submits in edit mode
- **THEN** `updateJob` is called with the job's ID and the new field values (**without** price)
- **AND** the popup closes
- **AND** the jobs table reflects the workbook store

#### Scenario: Validation in edit mode matches create mode

- **WHEN** user clears the description field and submits in edit mode
- **THEN** a validation error is shown
- **AND** no update is performed

### Requirement: CreateJobPopup accepts preset client

The system SHALL allow `CreateJobPopup` to receive an optional `presetClientId`. When provided, the form SHALL open with that client pre-selected. When opened from the client detail empty jobs state, the client selector MAY be hidden or read-only as long as the submitted job uses that `client_id`. When `presetClientId` is omitted, behavior SHALL match the existing jobs page create flow.

#### Scenario: Preset client on submit

- **WHEN** user submits CreateJobPopup opened with presetClientId "CL2" and valid description
- **THEN** the created job has client_id "CL2"

#### Scenario: Jobs page create unchanged

- **WHEN** user opens CreateJobPopup from `/jobs` without presetClientId
- **THEN** the searchable client selector is shown as today

### Requirement: Add job button on jobs page

The system SHALL display an "Add job" button on the `/jobs` page. Clicking the button SHALL open the CreateJobPopup.

#### Scenario: Button visible on jobs page

- **WHEN** user views `/jobs` and the workbook store is ready
- **THEN** "Add job" button is visible

#### Scenario: Button opens popup

- **WHEN** user clicks "Add job"
- **THEN** CreateJobPopup opens

### Requirement: createJob service operates in memory

The `createJob` service SHALL generate an auto-incrementing ID from the in-memory jobs array, add the new row to the workbook store, and set the dirty flag. It SHALL NOT call `SheetsRepository` methods.

#### Scenario: Job created in memory

- **WHEN** the user creates a new job via the form
- **THEN** the job row is added to the workbook store
- **AND** the dirty flag is set
- **AND** no backend call occurs

#### Scenario: ID increments based on existing jobs

- **WHEN** jobs J1 and J2 already exist in the store
- **AND** createJob is called
- **THEN** the new job gets ID J3

### Requirement: updateJobStatus service updates status and optional income transaction

The system SHALL provide an `updateJobStatus` service that updates a job's status in the workbook store. The service SHALL find the job's row in the in-memory jobs matrix and match by ID. If the new status is "paid", the service SHALL append an income transaction to the workbook store **unless** the caller passes an option to skip transaction creation (e.g. `createIncomeTransaction: false`). Omitting that option SHALL preserve default behavior (append income transaction). The **income amount** SHALL equal **derived total** (sum of set piece prices for non-deleted pieces, including archived). The caller SHALL supply this amount (e.g. `paidPrice`) when transitioning to paid. The service SHALL **not** rely on persisting that amount on the `jobs` row for correctness. The service SHALL **not** modify piece `price` rows as part of marking paid to force a different total.

#### Scenario: Status updated in workbook store

- **WHEN** updateJobStatus is called with job ID and new status
- **THEN** the job's row in the workbook store is updated with the new status

#### Scenario: Paid status creates income transaction by default

- **WHEN** updateJobStatus is called with status "paid" and transaction creation is not disabled
- **THEN** a transaction row is added to the workbook store with type "income", the **confirmed payment amount** as amount, category "job", the job's description as concept, ref_type "job", ref_id as the job's ID, and the job's client_id

#### Scenario: Paid status skips transaction when opted out

- **WHEN** updateJobStatus is called with status "paid" and `createIncomeTransaction` is false
- **THEN** the job row is updated to paid in the store
- **AND** no transaction row is added

#### Scenario: Non-paid status does not create transaction

- **WHEN** updateJobStatus is called with status "in_progress"
- **THEN** no transaction is created

### Requirement: updateJob service updates header fields only

The system SHALL provide an `updateJob(spreadsheetId, jobId, payload)` service that updates a job's `description` and `client_id` fields in the workbook store. The service SHALL preserve `id`, `status`, and `created_at` unchanged. The service SHALL NOT create, modify, or delete any transaction rows. The service SHALL find the job row in the in-memory jobs matrix and update it in place.

#### Scenario: Header fields updated in store

- **WHEN** `updateJob` is called with jobId "J5" and payload `{ description: "Lamp", client_id: "CL3" }`
- **THEN** the job row for J5 is updated with those values
- **AND** `id`, `status`, and `created_at` remain unchanged

#### Scenario: Job not found throws error

- **WHEN** `updateJob` is called with a non-existent job ID
- **THEN** an error is thrown indicating the job was not found

### Requirement: Job archive cascades to children

Archiving a job SHALL cascade archive to all its pieces, piece_items, crm_notes (entity_type=job), and tag_links (entity_type=job) in the workbook store. All operations are in-memory only.

#### Scenario: Archive job cascades

- **WHEN** the user confirms archiving a job
- **THEN** the job's `archived` is set to `"true"`
- **AND** all pieces for that job are archived
- **AND** all piece_items for those pieces are archived
- **AND** all crm_notes with entity_type=job and matching entity_id are archived
- **AND** all tag_links with entity_type=job and matching entity_id are archived

### Requirement: Job detail shows archive and soft-delete actions

The job detail page SHALL display an **Archive** action for active jobs and a **Soft Delete** action for archived (but not yet soft-deleted) jobs. Edit SHALL be available only for active jobs. All labels SHALL use i18n.

#### Scenario: Active job detail shows Edit and Archive

- **WHEN** the user views the detail page of an active job
- **THEN** Edit and Archive actions are available

#### Scenario: Archived job detail shows Soft Delete

- **WHEN** the user views the detail page of an archived job (not soft-deleted)
- **THEN** a Soft Delete action is available
- **AND** Edit is not available

#### Scenario: Soft-deleted job detail shows not-found

- **WHEN** the user navigates to `/jobs/:jobId` for a soft-deleted job
- **THEN** the page renders a not-found state

### Requirement: Job detail page allows editing job header fields

The job detail page SHALL display lifecycle actions in the job summary header consistent with the `entity-lifecycle` capability: Edit for active jobs, Archive for active jobs, Soft Delete for archived jobs. The Edit button SHALL open `CreateJobPopup` in edit mode (pre-filled with the current job). After a successful archive from the detail page, the system SHALL navigate appropriately (e.g. to `/jobs`). All labels SHALL use i18n.

#### Scenario: Edit button on detail page opens popup

- **WHEN** user clicks Edit on the job detail header
- **THEN** the job popup opens in edit mode with the current job's fields

#### Scenario: Successful edit updates detail header

- **WHEN** user edits a job from the detail page and submits
- **THEN** the detail header updates to reflect the new values from the workbook store

### Requirement: EntityDetailPage is a reusable detail layout component

The system SHALL provide a generic `EntityDetailPage` component that renders: a back-navigation link (configurable route and label), a header card with configurable field entries (label + value pairs), primary action buttons (e.g. Edit, Archive, Soft Delete) driven by callbacks, and a children slot for entity-specific content. The component SHALL accept props for back link route, back link label, title, fields array, lifecycle action callbacks, and React children. `JobDetailPage` SHALL use `EntityDetailPage` to render its header and actions, passing the pieces section as children. All action labels SHALL use i18n.

#### Scenario: EntityDetailPage renders header with fields

- **WHEN** `EntityDetailPage` is rendered with title "Phone case" and fields [id: "J1", client: "Alice", **total**: derived sum of **set** piece prices on **non-deleted** pieces (**including** archived), or incomplete label with highlight when any counting piece price is unset]
- **THEN** the header card displays the title and all field label-value pairs

#### Scenario: Back link navigates to list

- **WHEN** user clicks the back link on `EntityDetailPage`
- **THEN** navigation goes to the configured route

#### Scenario: Children render below header

- **WHEN** `EntityDetailPage` is rendered with children (e.g., a pieces section)
- **THEN** the children appear below the header card

### Requirement: Job entities are parsed from the workbook store

The system SHALL derive `Job` objects for UI from the jobs tab matrix held in the workbook store (filtering out rows without id, parsing optional legacy `price` as a number or undefined if empty, sorting by created_at descending as needed). **User-visible job totals SHALL be computed from pieces**, not from `jobs.price`. Hydration SHALL populate that matrix; routine navigation SHALL not call `readRows` for jobs alone.

#### Scenario: Jobs available after hydration

- **WHEN** the workbook store is hydrated
- **THEN** jobs pages can read Job objects from the store-derived data

#### Scenario: Legacy empty job price is returned as undefined

- **WHEN** a job row has an empty price field
- **THEN** the Job object may have `price` as undefined
- **AND** UI still shows totals from pieces when rendering lists and detail

### Requirement: Marking paid does not rewrite piece prices

When the user confirms marking a job paid, the system SHALL **not** add or change piece `price` values solely to match a payment total; **derived total** is always read from existing piece rows.

#### Scenario: Confirm paid leaves piece prices unchanged

- **WHEN** counting pieces have set prices summing to €45
- **AND** the user confirms paid
- **THEN** each piece's stored `price` is unchanged from before the transition

### Requirement: Incomplete piece pricing is visibly highlighted

When the UI shows the **incomplete pricing** state for a job (at least one non-deleted counting piece exists and any such piece has unset `price`), the i18n incomplete label SHALL use **visually distinct** styling (e.g. colored background and border) wherever that label appears, including: jobs list **Total** column, client detail embedded jobs **Total** column, job detail header **Total** field, and dashboard kanban job cards that show totals when counting pieces exist.

#### Scenario: Incomplete total uses highlight styling

- **WHEN** a surface would show the incomplete pricing label for a job
- **THEN** that label is not rendered as plain body text alone; it uses prominent styling consistent with a warning or attention badge

### Requirement: useWorkbookEntities provides reactive workbook data

The system SHALL provide a `useWorkbookEntities` hook (or equivalent) that selects jobs and related entities from the workbook store so list and detail pages update synchronously when the store mutates.

#### Scenario: Jobs page reads from workbook hook

- **WHEN** the jobs page mounts with a hydrated workbook
- **THEN** job data comes from the workbook store via the shared hook
- **AND** no TanStack Query fetch runs for jobs on that navigation

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

All user-facing strings on the jobs page and job detail page (table headers, button labels, empty state, form labels, validation messages, status labels, confirmation dialog text including leave-paid and income-transaction checkbox labels, edit action labels, archive action labels, soft-delete labels, edit popup title, archive confirmation title and message, cascade-archive warning text, and EntityDetailPage action labels) SHALL use i18next for translation support in both English and Spanish.

#### Scenario: Table headers are translatable

- **WHEN** jobs table renders
- **THEN** column headers come from i18n keys

#### Scenario: Status labels are translatable

- **WHEN** the status dropdown renders
- **THEN** status options display localized labels

#### Scenario: Form labels are translatable

- **WHEN** CreateJobPopup renders (in create or edit mode)
- **THEN** field labels, buttons, and validation messages come from i18n keys

#### Scenario: Confirmation dialog text is translatable

- **WHEN** a confirmation dialog renders (including archive confirmation)
- **THEN** title, message, and button labels come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown
- **THEN** message comes from i18n keys

#### Scenario: Edit and archive action labels are translatable

- **WHEN** the jobs table or job detail page renders action buttons
- **THEN** Edit, Archive, and Soft Delete labels come from i18n keys as applicable
