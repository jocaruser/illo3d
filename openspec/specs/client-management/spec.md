# client-management Specification

## Purpose

In-app listing, creation, editing, and deletion of clients: dedicated `/clients` route, table backed by the clients sheet with per-row edit and delete actions, modal form to append and update clients, `createClient`, `updateClient`, and `deleteClient` services, header navigation, and i18n for all clients UI strings.

## Requirements

### Requirement: Clients page displays client table

The system SHALL provide a `/clients` route that displays a table of all clients from the clients sheet. The table SHALL show: name, email, phone, notes, created_at, and per-row actions to edit and delete the client. The **name** column SHALL render each client’s name as the visible text of a link to `/clients/:clientId` for that client’s id.

#### Scenario: Clients table renders with data

- **WHEN** authenticated user navigates to `/clients`
- **AND** clients exist in the sheet
- **THEN** table displays all clients with name, email, phone, notes, and created_at columns
- **AND** each row includes Edit and Delete actions

#### Scenario: Empty state shown when no clients

- **WHEN** authenticated user navigates to `/clients`
- **AND** no clients exist in the sheet
- **THEN** table shows empty state message

#### Scenario: Edit and delete actions are visible

- **WHEN** user views the clients table and at least one client exists
- **THEN** Edit and Delete controls are visible for each row

#### Scenario: Client name links to detail

- **WHEN** the table displays a client with id "CL1" and name "Acme"
- **THEN** the name cell shows "Acme" as the label of a link to `/clients/CL1`

### Requirement: Clients page shows connection status

The system SHALL display the sheets connection status on the clients page. The page SHALL connect to the spreadsheet on mount and show connecting, connected, or error states using the same `ConnectionStatus` component as other pages.

#### Scenario: Connection status while connecting

- **WHEN** the clients page loads
- **THEN** the connection status indicator is visible while connecting

#### Scenario: Table shown after connected

- **WHEN** connection succeeds
- **THEN** the clients table (or empty state) is displayed

#### Scenario: Error with retry on connection failure

- **WHEN** connection fails
- **THEN** an error message with retry option is displayed

### Requirement: CreateClientPopup is a reusable modal form

The system SHALL provide a CreateClientPopup component that renders a modal with a form. The form SHALL collect: name (required), email (optional), phone (optional), notes (optional). The popup SHALL be closable via overlay click or cancel button. The same component SHALL support an edit mode when opened for an existing client: fields SHALL be prefilled, the title SHALL indicate editing, and submit SHALL update that client instead of creating one.

#### Scenario: Popup opens and shows form fields

- **WHEN** user clicks "Add client" button
- **THEN** modal displays with name, email, phone, and notes inputs

#### Scenario: Popup can be closed without submitting

- **WHEN** user opens the popup
- **THEN** user can close it via overlay click or cancel button
- **AND** no client is created

#### Scenario: Name is required

- **WHEN** user submits the form with an empty name
- **THEN** a validation error is shown
- **AND** no client is created

#### Scenario: Successful submission creates client and refreshes table

- **WHEN** user fills in a valid name and submits in create mode
- **THEN** a client record is appended to the clients sheet
- **AND** the popup closes
- **AND** the clients table refreshes to show the new client

#### Scenario: Edit mode opens with prefilled values

- **WHEN** user opens the popup from Edit on a client row
- **THEN** name, email, phone, and notes are prefilled from that client

#### Scenario: Successful edit updates client and refreshes table

- **WHEN** user changes fields and submits in edit mode
- **THEN** the corresponding row in the clients sheet is updated
- **AND** the popup closes
- **AND** the clients table reflects the updated values

### Requirement: Add client button on clients page

The system SHALL display an "Add client" button on the `/clients` page. Clicking the button SHALL open the CreateClientPopup.

#### Scenario: Button visible on clients page

- **WHEN** user views `/clients` and connection is established
- **THEN** "Add client" button is visible

#### Scenario: Button opens popup

- **WHEN** user clicks "Add client"
- **THEN** CreateClientPopup opens

### Requirement: createClient service appends client row

The system SHALL provide a `createClient` service that appends a row to the clients sheet via the SheetsRepository. The service SHALL generate an auto-incrementing ID with "CL" prefix (CL1, CL2, ...) and set `created_at` to the current ISO date.

#### Scenario: Client row appended with generated ID

- **WHEN** createClient is called with name, email, phone, notes
- **THEN** a row is appended to the clients sheet with a "CL"-prefixed ID and current date as created_at

#### Scenario: ID increments based on existing clients

- **WHEN** clients CL1 and CL2 already exist
- **AND** createClient is called
- **THEN** the new client gets ID CL3

### Requirement: Client delete uses confirmation dialog

The system SHALL require confirmation before deleting a client. The UI SHALL use the existing ConfirmDialog pattern. On confirm, the system SHALL call `deleteClient`; on cancel, no data change occurs.

#### Scenario: Delete prompts for confirmation

- **WHEN** user clicks Delete on a client row
- **THEN** a confirmation dialog is shown with the client name or identifier

#### Scenario: Cancel leaves data unchanged

- **WHEN** user cancels the delete confirmation
- **THEN** the client row remains in the sheet and table

### Requirement: deleteClient refuses when jobs reference the client

The system SHALL NOT delete a client if any job row has `client_id` equal to that client’s id. The service SHALL fail with an error suitable for display; no sheet rows are removed.

#### Scenario: Delete blocked when jobs exist

- **WHEN** deleteClient is called for a client id that is referenced by at least one job
- **THEN** the operation fails without deleting the client row

#### Scenario: Delete allowed when no jobs reference client

- **WHEN** deleteClient is called for a client id not referenced by any job
- **THEN** that client row is removed from the clients sheet

### Requirement: updateClient service updates client row

The system SHALL provide an `updateClient` service that writes changes to the existing clients row via `SheetsRepository.updateRow`. The service SHALL preserve `id` and `created_at`; it SHALL update name, email, phone, and notes from the payload.

#### Scenario: Client row updated in sheet

- **WHEN** updateClient is called with spreadsheet id, client id, and field values
- **THEN** the row for that client id is overwritten with the new values and original id and created_at

### Requirement: Optimistic update for client edit

The clients table UI SHALL apply an optimistic update when an edit save succeeds locally before the server round-trip completes, and SHALL reconcile on error (e.g. invalidate queries or restore prior data).

#### Scenario: Table updates optimistically on edit

- **WHEN** user saves an edit and the update succeeds
- **THEN** the table shows the edited values without requiring a full refetch for correctness

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

#### Scenario: Edit, delete, and confirmation strings are translatable

- **WHEN** clients table shows Edit and Delete actions or a delete confirmation dialog
- **THEN** action labels and confirmation copy use i18n keys
