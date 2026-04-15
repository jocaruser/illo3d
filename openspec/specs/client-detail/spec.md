# client-detail Specification

## Purpose

Per-client CRM view at `/clients/:clientId`: spreadsheet-backed client header (including extended CRM fields where present), identity editing, ledger- and job-derived metrics, unified `crm_notes` sheet with multi-note CRM behavior for client-scoped rows, severities, mention linkify in bodies, and prominence UI, jobs list with links and client-scoped job creation, breadcrumbs and nav active state, and fixture coverage for notes and income-linked metrics.

## Requirements

### Requirement: crm_notes sheet and CrmNote persistence for client scope

The system SHALL persist CRM notes for clients and jobs in a single `crm_notes` sheet with header columns in order: `id`, `entity_type`, `entity_id`, `body`, `referenced_entity_ids`, `severity`, `created_at`. Client-scoped rows SHALL use `entity_type` `client` and `entity_id` equal to the client's id (`CL…`). Note ids for notes created from the client-note flow SHALL use an auto-incrementing `CN` prefix (CN1, CN2, …). Note ids for notes created from the job-note flow SHALL use an auto-incrementing `JN` prefix (JN1, JN2, …). The `severity` field SHALL be one of: `info`, `danger`, `warning`, `success`, `primary`, `secondary`. The `body` SHALL be plain text and MAY contain `@PREFIXid` mentions per application grammar. The `referenced_entity_ids` SHALL store a space-separated list of canonical entity ids (e.g. `CL2 JB4`) with no `@` characters, MAY be empty, and SHALL be treated as derived from `body` on create/update. The application type `ClientNote` (client-scoped view) SHALL mirror client-scoped fields for UI and services.

#### Scenario: Client note row structure

- **WHEN** a client-scoped CRM note is stored in the sheet
- **THEN** it includes id, entity_type `client`, entity_id, body, referenced_entity_ids, severity, and created_at

#### Scenario: Severity is restricted

- **WHEN** a note is created or updated with an invalid severity value
- **THEN** the operation is rejected with a user-visible or logged validation error and no row is written

### Requirement: crm_notes included in spreadsheet config and validation

The system SHALL register `crm_notes` in the same sheet registry used for other tabs (`SHEET_NAMES`, `SHEET_HEADERS`). New spreadsheets created by the app SHALL include the `crm_notes` tab with the header row. `validateStructure` SHALL treat a missing or malformed `crm_notes` tab like other required sheets.

#### Scenario: New spreadsheet includes crm_notes

- **WHEN** the app creates a new spreadsheet
- **THEN** the workbook contains a `crm_notes` sheet with the expected headers

### Requirement: CRM notes domain services and hook

The system SHALL provide `fetchCrmNotes(spreadsheetId)` reading all CRM note rows across entities, filtering invalid rows, and returning `CrmNote` objects. The system SHALL provide `createClientNote`, `updateClientNote`, and `deleteClientNote` services that append, update, or delete client-scoped rows in `crm_notes` via `SheetsRepository` using the same row-index patterns as other entities. On create and update, the services SHALL compute `referenced_entity_ids` from `body` and persist it alongside `body`. The system SHALL provide `useCrmNotes(spreadsheetId)` using TanStack Query with key `['crm_notes', spreadsheetId]` and the same enabled/null pattern as `useClients`. Client detail MAY use `fetchClientNotes` as an adapter that filters `fetchCrmNotes` to client-scoped rows with the `ClientNote` shape.

#### Scenario: Hook loads notes when connected

- **WHEN** client detail mounts with a valid spreadsheet id
- **THEN** CRM notes data for the workbook is available to the page (via `useCrmNotes` or equivalent)

#### Scenario: Create appends CN-prefixed client row

- **WHEN** createClientNote is called with client id and body
- **THEN** a new `crm_notes` row is appended with generated CN id, entity_type `client`, current ISO created_at, and referenced_entity_ids consistent with body

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

### Requirement: Client detail shows extended CRM fields

The client detail header area SHALL display preferred_contact, lead_source, and address when non-empty, using i18n labels. The `lead_source` value SHALL be rendered using the same mention linkify component as CRM notes so `@PREFIXid` tokens become links when resolvable from in-memory data.

#### Scenario: Extended fields visible

- **WHEN** client CL1 has preferred_contact or lead_source or address set
- **THEN** client detail shows those values with appropriate labels

#### Scenario: Lead source mention uses fallback when unknown

- **WHEN** lead_source contains `@CL999` and that client is not in loaded data
- **THEN** the UI still renders without error and shows a non-crashing fallback for that token

### Requirement: Client detail page layout and header

The client detail page SHALL connect to the spreadsheet on mount and display `ConnectionStatus` like other data pages. The page SHALL use `EntityDetailPage` for the header with `title` equal to the client name, `backTo` `/clients`, and fields including: client id, email, phone, created_at, preferred_contact when non-empty, lead_source when non-empty (with linkified mentions), address when non-empty, and when `clients.notes` is non-empty a read-only field labeled distinctly from CRM notes (e.g. sheet note). Identity editing SHALL use the existing `CreateClientPopup` opened from Edit. Delete SHALL use the existing confirmation pattern and `deleteClient`; on success the app SHALL navigate to `/clients`. All new labels SHALL use i18n.

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

The system SHALL render a notes section with inline add, per-row edit, per-row delete, plain `body` input, and severity selector. Notes SHALL be filtered to `crm_notes` rows where `entity_type` is `client` and `entity_id` matches the page’s client. When displaying note bodies (list, previews, or read-only states), the system SHALL render `@PREFIXid` tokens using the shared linkify behavior with entity-name labels when available and safe fallbacks otherwise. When any visible note has `severity` other than `info` or `secondary`, the page SHALL also render a **severity strip** (badges or alerts) above or beside the list so important notes remain obvious without relying on tabs alone.

#### Scenario: User adds a note inline

- **WHEN** user enters body and severity and saves a new note
- **THEN** a `crm_notes` row is created for that client and the list updates
- **AND** referenced_entity_ids matches mentions parsed from body

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

### Requirement: Happy-path fixtures include crm_notes and sample income

The happy-path fixture data SHALL include a `crm_notes.csv` whose header row matches `SHEET_HEADERS.crm_notes` and SHALL include at least one client-scoped row for an existing client with a non-empty `referenced_entity_ids` when the body contains mentions. The folder SHALL extend `transactions.csv` (and jobs if needed) so at least one income row has `client_id` matching a fixture client for metric testing.

#### Scenario: Fixture has client CRM note

- **WHEN** tests load happy-path fixtures
- **THEN** crm_notes contains at least one valid client-scoped row linked to a fixture client
