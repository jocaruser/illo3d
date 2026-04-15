# client-detail Specification

## Purpose

Per-client CRM view at `/clients/:clientId`: spreadsheet-backed client header and identity editing, ledger- and job-derived metrics, multi-note `client_notes` sheet with severities and prominence UI, jobs list with links and client-scoped job creation, breadcrumbs and nav active state, and fixture coverage for notes and income-linked metrics.

## Requirements

### Requirement: client_notes sheet and ClientNote model

The system SHALL persist CRM notes in a `client_notes` sheet with header columns in order: `id`, `client_id`, `body`, `severity`, `created_at`. Each row SHALL represent one note for one client. Note ids SHALL use an auto-incrementing `CN` prefix (CN1, CN2, …). The `severity` field SHALL be one of: `info`, `danger`, `warning`, `success`, `primary`, `secondary`. The `body` SHALL be plain text. The application domain type `ClientNote` SHALL mirror these fields.

#### Scenario: Note row structure

- **WHEN** a client note is stored in the sheet
- **THEN** it includes id, client_id, body, severity, and created_at

#### Scenario: Severity is restricted

- **WHEN** a note is created or updated with an invalid severity value
- **THEN** the operation is rejected with a user-visible or logged validation error and no row is written

### Requirement: client_notes included in spreadsheet config and validation

The system SHALL register `client_notes` in the same sheet registry used for other tabs (`SHEET_NAMES`, `SHEET_HEADERS`). New spreadsheets created by the app SHALL include the `client_notes` tab with the header row. `validateStructure` SHALL treat a missing or malformed `client_notes` tab like other required sheets.

#### Scenario: New spreadsheet includes client_notes

- **WHEN** the app creates a new spreadsheet
- **THEN** the workbook contains a `client_notes` sheet with the expected headers

### Requirement: Client notes domain services and hook

The system SHALL provide `fetchClientNotes(spreadsheetId)` reading all note rows, filtering invalid rows, and returning `ClientNote` objects. The system SHALL provide `createClientNote`, `updateClientNote`, and `deleteClientNote` services that append, update, or delete rows via `SheetsRepository` using the same row-index patterns as other entities. The system SHALL provide `useClientNotes(spreadsheetId)` using TanStack Query with key `['client_notes', spreadsheetId]` and the same enabled/null pattern as `useClients`.

#### Scenario: Hook loads notes when connected

- **WHEN** client detail mounts with a valid spreadsheet id
- **THEN** client notes are fetched for the workbook

#### Scenario: Create appends CN-prefixed row

- **WHEN** createClientNote is called with client_id and body
- **THEN** a new row is appended with generated CN id and current ISO created_at

### Requirement: Client detail route and access control

The system SHALL provide a protected route `/clients/:clientId`. When the sheet connection is connected and the client id does not exist, the system SHALL show a not-found message with a link back to `/clients`. Unauthenticated users SHALL be redirected to `/login`.

#### Scenario: Authenticated user opens existing client

- **WHEN** an authenticated user navigates to `/clients/CL1`
- **AND** client CL1 exists
- **THEN** the client detail page renders

#### Scenario: Unknown client id

- **WHEN** authenticated user navigates to `/clients/CL999`
- **AND** no such client exists
- **THEN** a not-found state is shown with navigation back to the clients list

### Requirement: Client detail page layout and header

The client detail page SHALL connect to the spreadsheet on mount and display `ConnectionStatus` like other data pages. The page SHALL use `EntityDetailPage` for the header with `title` equal to the client name, `backTo` `/clients`, and fields including: client id, email, phone, created_at, and when `clients.notes` is non-empty a read-only field labeled distinctly from CRM notes (e.g. sheet note). Identity editing SHALL use the existing `CreateClientPopup` opened from Edit. Delete SHALL use the existing confirmation pattern and `deleteClient`; on success the app SHALL navigate to `/clients`. All new labels SHALL use i18n.

#### Scenario: Edit opens popup

- **WHEN** user clicks Edit on the client detail header
- **THEN** CreateClientPopup opens in edit mode with that client

#### Scenario: Successful delete returns to list

- **WHEN** user confirms delete and deleteClient succeeds
- **THEN** the browser navigates to `/clients`

### Requirement: Client detail metrics strip

Below the header, the system SHALL display a metrics strip with at least: **Paid (ledger)** = sum of `amount` for transactions where `type` is `income` and `client_id` matches this client; **Outstanding (jobs)** = sum of `job.price` (0 if missing) for jobs where `client_id` matches and `status` is neither `paid` nor `cancelled`; **Job count** = count of all jobs for this client; **Average job price** = arithmetic mean of `price` over jobs for this client where `price` is numeric and `status` is not `cancelled`; **Materials (estimate)** = sum over this client’s jobs of material cost for pieces with `status` in `done` or `failed`, where material cost for a piece is the sum of `piece_item.quantity × unit_cost(inventory)` and `unit_cost` is `expense.amount / inventory.qty_initial` for the linked expense. Metrics SHALL use distinct i18n labels so **Paid (ledger)** is not confused with **Outstanding (jobs)**.

#### Scenario: Metrics use ledger for paid total

- **WHEN** client has income transactions totaling €100 for that client_id
- **THEN** Paid (ledger) shows €100 regardless of job status rows

#### Scenario: Outstanding excludes paid and cancelled

- **WHEN** client has one draft job price €10 and one paid job price €20
- **THEN** Outstanding (jobs) shows €10

#### Scenario: Materials uses done and failed pieces only

- **WHEN** client has one job with a done piece that consumes inventory with known unit cost
- **THEN** Materials (estimate) includes that consumption in the sum

### Requirement: Client notes UI and severity prominence

The system SHALL render a notes section with inline add, per-row edit, per-row delete, plain `body` input, and severity selector. Notes SHALL be filtered to rows where `client_id` matches the page’s client. When any visible note has `severity` other than `info` or `secondary`, the page SHALL also render a **severity strip** (badges or alerts) above or beside the list so important notes remain obvious without relying on tabs alone.

#### Scenario: User adds a note inline

- **WHEN** user enters body and severity and saves a new note
- **THEN** a client_notes row is created and the list updates

#### Scenario: Danger note is prominent

- **WHEN** a note has severity `danger`
- **THEN** the severity strip highlights that note per design (badge or alert)

### Requirement: Client detail jobs section

The system SHALL list jobs whose `client_id` matches `:clientId`, initially ordered by `created_at` descending with stable secondary ordering by job `id` when timestamps tie, matching the default ordering of the main jobs table until the user changes sort. Each job id SHALL link to `/jobs/:jobId`. Columns SHALL include at least id, description, status, price (formatted as currency), and created_at. The embedded list SHALL expose the same shared list discovery controls (search, fuzzy matching, sortable data columns, responsive column visibility) defined in the `list-table-discovery` capability. When there are no jobs, the system SHALL show table headers with an empty body and a primary control to add a job that opens `CreateJobPopup` with `presetClientId` set to this client.

#### Scenario: Job id links to job detail

- **WHEN** jobs section lists job J1
- **THEN** the id cell links to `/jobs/J1`

#### Scenario: Empty jobs shows add control

- **WHEN** client has zero jobs
- **THEN** the jobs area shows headers and an Add job action scoped to this client

### Requirement: Breadcrumbs for client detail

When the path matches `/clients/:clientId`, breadcrumbs SHALL be Home → Clients → client name, using the client name from loaded data or falling back to the id. The implementation MAY resolve the name from TanStack Query cache keyed like `resolveJobDescription`.

#### Scenario: Breadcrumb shows name

- **WHEN** user views `/clients/CL1` and client CL1 has name "Acme"
- **THEN** the last breadcrumb label is "Acme"

### Requirement: Header Clients nav active on client detail

The Clients header `NavLink` SHALL appear active when the path starts with `/clients` including client detail paths, consistent with Jobs behavior.

#### Scenario: Nav highlights on detail

- **WHEN** user is on `/clients/CL1`
- **THEN** the Clients navigation item is in the active styling state

### Requirement: Client detail UI strings support i18n

All new user-visible strings on the client detail page (metrics labels, notes section, empty jobs, severity labels, legacy sheet note label) SHALL use i18next in English and Spanish.

#### Scenario: Metric labels are translatable

- **WHEN** client detail renders
- **THEN** Paid (ledger) and Outstanding (jobs) strings come from i18n keys

### Requirement: Happy-path fixtures include client_notes and sample income

The happy-path fixture data SHALL include a `client_notes.csv` with at least one row for an existing client and SHALL extend `transactions.csv` (and jobs if needed) so at least one income row has `client_id` matching a fixture client for metric testing.

#### Scenario: Fixture has client note

- **WHEN** tests load happy-path fixtures
- **THEN** client_notes contains at least one valid row linked to a fixture client
