# client-management Specification

## Purpose

In-app listing and creation of clients: dedicated `/clients` route, read-only table backed by the clients sheet, modal form to append new clients, `createClient` service, header navigation, and i18n for all clients UI strings.

## Requirements

### Requirement: Clients page displays client table

The system SHALL provide a `/clients` route that displays a table of all clients from the clients sheet. The table SHALL show: name, email, phone, notes, created_at. The table SHALL be read-only (no inline edit or delete controls).

#### Scenario: Clients table renders with data

- **WHEN** authenticated user navigates to `/clients`
- **AND** clients exist in the sheet
- **THEN** table displays all clients with name, email, phone, notes, and created_at columns

#### Scenario: Empty state shown when no clients

- **WHEN** authenticated user navigates to `/clients`
- **AND** no clients exist in the sheet
- **THEN** table shows empty state message

#### Scenario: No edit or delete controls on table

- **WHEN** user views the clients table
- **THEN** no edit, delete, or remove buttons are visible on the table

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

The system SHALL provide a CreateClientPopup component that renders a modal with a form. The form SHALL collect: name (required), email (optional), phone (optional), notes (optional). The popup SHALL be closable via overlay click or cancel button.

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

- **WHEN** user fills in a valid name and submits
- **THEN** a client record is appended to the clients sheet
- **AND** the popup closes
- **AND** the clients table refreshes to show the new client

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

### Requirement: Clients navigation link in header

The system SHALL display a "Clients" link in the app header navigation. The link SHALL navigate to `/clients`. The link SHALL appear before the "Transactions" link.

#### Scenario: Clients link visible in header

- **WHEN** user is on any authenticated page
- **THEN** a "Clients" navigation link is visible in the header

#### Scenario: Clients link navigates to /clients

- **WHEN** user clicks the "Clients" header link
- **THEN** the browser navigates to `/clients`

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
