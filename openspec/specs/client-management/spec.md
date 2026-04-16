# client-management Specification

## Purpose

In-app listing, creation, editing, and archiving of clients: dedicated `/clients` route, table backed by the workbook store with per-row edit and archive actions, modal form to create and update clients in memory, `createClient`, `updateClient`, and `deleteClient` (archive/cascade) services, header navigation, and i18n for all clients UI strings.

## Requirements

### Requirement: Clients table displays active clients

The system SHALL provide a `/clients` route that displays a table of all **active** clients (where `archived` is not `"true"` and `deleted` is not `"true"`) from the workbook store. The table SHALL show: name, email, phone, notes, created_at, and per-row actions to edit and **archive** the client. The **name** column SHALL render each client's name as the visible text of a link to `/clients/:clientId`.

#### Scenario: Table shows only active clients

- **WHEN** authenticated user visits `/clients`
- **THEN** the table shows clients where `archived` and `deleted` are both empty/false
- **AND** archived or soft-deleted clients are not shown

#### Scenario: Each row has Edit and Archive actions

- **WHEN** the clients table renders
- **THEN** each row includes Edit and Archive actions (not Delete)

#### Scenario: Empty state shown when no active clients

- **WHEN** authenticated user navigates to `/clients`
- **AND** no active clients exist in the workbook store
- **THEN** table shows empty state message

#### Scenario: Client name links to detail

- **WHEN** the table displays a client with id "CL1" and name "Acme"
- **THEN** the name cell shows "Acme" as the label of a link to `/clients/CL1`

### Requirement: Client detail embedded jobs table shows all children including archived

The client detail page's embedded jobs table SHALL show **all jobs** for that client, regardless of lifecycle state. Active jobs render normally with full actions. Archived jobs render with **strikethrough styling** and offer only **Un-archive** (no Edit). Soft-deleted jobs render with strikethrough and display **"Deleted entity"** (i18n) as the name. This embedded table is the place where the user can see and manage the full history of a client's jobs.

#### Scenario: Archived job visible in client detail jobs table

- **WHEN** a client has an archived job
- **AND** the user views the client detail page
- **THEN** the archived job appears in the jobs table with strikethrough styling
- **AND** Un-archive action is available, Edit is not

#### Scenario: Soft-deleted job visible in client detail jobs table

- **WHEN** a client has a soft-deleted job
- **AND** the user views the client detail page
- **THEN** the soft-deleted job appears with strikethrough styling and "Deleted entity" label

#### Scenario: Active job renders normally in client detail jobs table

- **WHEN** a client has an active job
- **AND** the user views the client detail page
- **THEN** the active job appears normally with Edit and Archive actions

### Requirement: CreateClientPopup is a reusable modal form

The system SHALL provide a CreateClientPopup component that renders a modal with a form. The form SHALL collect: name (required), email (optional), phone (optional), notes (optional), preferred_contact (optional, free text), lead_source (optional, free text; `@PREFIXid` mentions allowed in stored value), address (optional, multi-line plain text). The popup SHALL be closable via overlay click or cancel button. The same component SHALL support an edit mode when opened for an existing client: fields SHALL be prefilled, the title SHALL indicate editing, and submit SHALL update that client instead of creating one.

#### Scenario: Popup opens and shows form fields

- **WHEN** user clicks "Add client" button
- **THEN** modal displays with name, email, phone, notes, preferred_contact, lead_source, and address inputs

#### Scenario: Popup can be closed without submitting

- **WHEN** user opens the popup
- **THEN** user can close it via overlay click or cancel button
- **AND** no client is created

#### Scenario: Name is required

- **WHEN** user submits the form with an empty name
- **THEN** a validation error is shown
- **AND** no client is created

#### Scenario: Successful submission creates client in memory

- **WHEN** user fills in a valid name and submits in create mode
- **THEN** a client record is added to the workbook store
- **AND** the popup closes
- **AND** the clients table shows the new client without a repository write

#### Scenario: Edit mode opens with prefilled values

- **WHEN** user opens the popup from Edit on a client row
- **THEN** name, email, phone, notes, preferred_contact, lead_source, and address are prefilled from that client

#### Scenario: Successful edit updates client in memory

- **WHEN** user changes fields and submits in edit mode
- **THEN** the corresponding row in the workbook store is updated
- **AND** the popup closes
- **AND** the clients table reflects the updated values

### Requirement: Add client button on clients page

The system SHALL display an "Add client" button on the `/clients` page. Clicking the button SHALL open the CreateClientPopup.

#### Scenario: Button visible on clients page

- **WHEN** user views `/clients` and the workbook store is ready
- **THEN** "Add client" button is visible

#### Scenario: Button opens popup

- **WHEN** user clicks "Add client"
- **THEN** CreateClientPopup opens

### Requirement: createClient service operates in memory

The `createClient` service SHALL generate an auto-incrementing ID with "CL" prefix from the in-memory clients array, add the new row to the workbook store, and set the dirty flag. It SHALL NOT call `SheetsRepository.readRows` or `appendRows`.

#### Scenario: Client created in memory

- **WHEN** the user creates a new client via the form
- **THEN** the client row is added to the workbook store
- **AND** the dirty flag is set
- **AND** no backend call occurs

#### Scenario: ID increments based on existing clients

- **WHEN** clients CL1 and CL2 already exist in the store
- **AND** createClient is called
- **THEN** the new client gets ID CL3

### Requirement: Client archive uses confirmation dialog

The system SHALL require confirmation before archiving a client. The UI SHALL use the existing ConfirmDialog pattern. On confirm, the system SHALL set the client's `archived` flag to `"true"` in the workbook store and cascade archive to the client's jobs and their children. On cancel, no change occurs.

#### Scenario: Archive prompts for confirmation

- **WHEN** user clicks Archive on a client row
- **THEN** a confirmation dialog appears warning about archiving

#### Scenario: Archive cascades to jobs

- **WHEN** user confirms archiving a client
- **THEN** the client is archived in the workbook store
- **AND** all jobs for that client are archived
- **AND** each job's children (pieces, piece_items, notes, tag_links) are archived

### Requirement: updateClient service operates in memory

The `updateClient` service SHALL find the client row by ID in the workbook store, update its fields, and set the dirty flag. It SHALL NOT call `SheetsRepository.readRows` or `updateRow`.

#### Scenario: Client updated in memory

- **WHEN** the user edits and saves a client
- **THEN** the client row is updated in the workbook store
- **AND** the dirty flag is set
- **AND** no backend call occurs

### Requirement: Client table reflects store updates immediately

The clients table UI SHALL reflect edits as soon as the in-memory `updateClient` completes successfully.

#### Scenario: Table shows edited values after save

- **WHEN** user saves an edit and the update succeeds
- **THEN** the table shows the edited values from the workbook store

### Requirement: Clients navigation link in header

The system SHALL display a "Clients" link in the app header navigation. The link SHALL navigate to `/clients`. The link SHALL appear before the "Transactions" link. The Clients nav item SHALL remain active when the user is on a client detail path under `/clients/…` (not only on `/clients`).

#### Scenario: Clients link visible in header

- **WHEN** user is on any authenticated page
- **THEN** a "Clients" navigation link is visible in the header

#### Scenario: Clients link navigates to /clients

- **WHEN** user clicks the "Clients" header link
- **THEN** the browser navigates to `/clients`

#### Scenario: Clients nav active on detail route

- **WHEN** user is on `/clients/CL1`
- **THEN** the Clients navigation item uses the active styling

### Requirement: Clients UI strings support i18n

All user-facing strings on the clients page (table headers, button labels, empty state, form labels, validation messages) SHALL use i18next for translation support.

#### Scenario: Table headers are translatable

- **WHEN** clients table renders
- **THEN** column headers come from i18n keys

#### Scenario: Form labels are translatable

- **WHEN** CreateClientPopup renders
- **THEN** field labels, buttons, and validation messages come from i18n keys

#### Scenario: Empty state message is translatable

- **WHEN** empty state is shown
- **THEN** message comes from i18n keys

#### Scenario: Edit, archive, and confirmation strings are translatable

- **WHEN** clients table shows Edit and Archive actions or an archive confirmation dialog
- **THEN** action labels and confirmation copy use i18n keys

### Requirement: Clients list shows linked tags in an instant tooltip

On the clients table, when a client has linked tags, hovering or focusing the client name link SHALL show a custom tooltip (not the native `title` attribute alone) that appears without intentional browser delay, lists tag names in a readable layout, exposes an accessible name for screen readers, and does not clip inside the table scroll container (e.g. via fixed positioning or portal). Clients without tags SHALL keep a plain name link without a tag tooltip.

#### Scenario: Tooltip shows tag labels on hover

- **WHEN** the user hovers the name cell for a client that has tag links
- **THEN** a tooltip becomes visible immediately and includes the linked tag names
