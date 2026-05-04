# job-detail Specification

## Purpose

Job detail on `/jobs/:jobId`: job summary, pieces table (status, pricing, lot-based suggested price), inventory consumption on piece status changes, plus job-scoped CRM notes and tags using the unified `crm_notes` sheet and shared mention and severity patterns with client detail.

## Requirements

### Requirement: Job detail page lists pieces for that job

The system SHALL provide a job detail route `/jobs/:jobId` protected by the same authentication guard as `/jobs`. The system SHALL NOT provide a top-level Pieces tab or `/pieces` route. When the sheet connection is connected, the job detail page SHALL show a summary of the job and a **Pieces** section. The job summary SHALL be rendered as a responsive widget grid instead of a static header card. The Pieces section SHALL list only pieces whose `job_id` matches `:jobId`, with columns: id, name (**editable inline**), **`units`** (**editable inline**), status (**editable inline via Combobox**), **per-unit** price (editable), **computed line total** (units × price when both set, otherwise em dash or incomplete treatment consistent with `job-management`), per-piece suggested **per-unit** price (from BOM via lot-based avg cost), **per-piece expected benefit** when revenue and material are computable (otherwise placeholder), and `created_at` (job reference column omitted on this page). Rows SHALL be sorted by `created_at` descending. When no pieces exist for the job, the Pieces section SHALL show an empty state message using i18n. **Rows where `units` is unset SHALL use visually distinct highlighting** (e.g. row background or border) so the user can complete data entry. Piece items SHALL be **editable inline** with quantity, inventory (via Combobox), and delete controls. Multiple pieces MAY be expanded simultaneously to show their piece items.

#### Scenario: Authenticated user opens job detail with pieces

- **WHEN** an authenticated user with an active shop navigates to `/jobs/J1`
- **AND** the spreadsheet connection succeeds
- **AND** pieces exist for that job
- **THEN** the Pieces section shows those pieces with inline-editable fields
- **AND** no standalone Pieces navigation entry exists in the app header

#### Scenario: Unauthenticated user cannot open job detail

- **WHEN** an unauthenticated user navigates to `/jobs/J1`
- **THEN** the system redirects to `/login`

#### Scenario: Unset units row is highlighted

- **WHEN** a counting piece has unset `units`
- **THEN** that row is visually highlighted in the Pieces section

#### Scenario: Multiple pieces expanded

- **WHEN** the user expands two different pieces
- **THEN** both show their piece items simultaneously

### Requirement: EntityDetailPage is a reusable detail layout component
The system SHALL provide a generic `EntityDetailPage` component that renders: a back-navigation link (configurable route and label), a header card with configurable field entries (label + value pairs), primary action buttons (e.g. Edit, Archive, Soft Delete) driven by callbacks, and a children slot for entity-specific content. The component SHALL accept props for back link route, back link label, title, fields array, lifecycle action callbacks, and React children. `JobDetailPage` SHALL use `EntityDetailPage` to render its header and actions, passing the pieces section as children. **The header card SHALL be replaced by a responsive widget grid for job detail.** All action labels SHALL use i18n.

#### Scenario: EntityDetailPage renders header with fields

- **WHEN** `EntityDetailPage` is rendered with title "Phone case" and fields
- **THEN** the header displays the title and all field label-value pairs in a widget grid

#### Scenario: Back link navigates to list

- **WHEN** user clicks the back link on `EntityDetailPage`
- **THEN** navigation goes to the configured route

#### Scenario: Children render below header

- **WHEN** `EntityDetailPage` is rendered with children (e.g., a pieces section)
- **THEN** the children appear below the header card

### Requirement: Piece status change triggers inventory consumption using inventory items

When a piece status changes to `done` or `failed` and the user confirms with "Decrement from inventory" checked, the system SHALL decrement `inventory.qty_current` by **`piece_item.quantity × piece.units`** for each piece_item of that piece (with `units` required to be set per money-tracking), where `piece_item.inventory_id` references the inventory item (material identity). When the piece status reverts to `pending` with "Restore inventory quantities" checked, the system SHALL increment `inventory.qty_current` by the same **effective** amounts.

#### Scenario: Piece completion decrements inventory qty_current

- **WHEN** piece status changes to "done" or "failed"
- **AND** the user confirms with "Decrement from inventory" checked
- **AND** the piece has set `units`
- **THEN** inventory.qty_current is decremented by **effective consumption** for each piece_item

#### Scenario: Piece completion without inventory decrement

- **WHEN** piece status changes to "done" or "failed"
- **AND** the user unchecks "Decrement from inventory"
- **THEN** inventory.qty_current is NOT modified

#### Scenario: Piece reverts and restores inventory

- **WHEN** piece status changes from "done" or "failed" back to "pending"
- **AND** the user confirms with "Restore inventory quantities" checked
- **THEN** inventory.qty_current is incremented by the same effective amounts that were decremented

#### Scenario: Piece reverts without inventory restoration

- **WHEN** piece status changes from "done" or "failed" back to "pending"
- **AND** the user unchecks "Restore inventory quantities"
- **THEN** inventory.qty_current is NOT modified

### Requirement: Job-scoped CRM notes in crm_notes sheet

The system SHALL persist job-scoped CRM notes as rows in the unified `crm_notes` sheet with `entity_type` `job` and `entity_id` equal to the job id (`J…`). Headers SHALL match `SHEET_HEADERS.crm_notes`. Note ids for notes created from the job-note flow SHALL use an auto-incrementing `JN` prefix (JN1, JN2, …). The `severity` field SHALL use the same allowed values as client-scoped CRM notes. The `body` and `referenced_entity_ids` rules SHALL match client-scoped notes (plain text body, derived space-separated ids on save). The application type `JobNote` SHALL mirror job-scoped fields for UI and services.

#### Scenario: Job note row structure

- **WHEN** a job-scoped CRM note is stored in the sheet
- **THEN** it includes id, entity_type `job`, entity_id, body, referenced_entity_ids, severity, and created_at

### Requirement: Job CRM notes registered and validated like other sheets

The system SHALL register `crm_notes` in `SHEET_NAMES` and `SHEET_HEADERS`. Golden fixtures SHALL include `crm_notes.csv` with a correct header row. `validateStructure` and new-shop creation SHALL treat `crm_notes` like other required sheets for the current schema.

#### Scenario: Fixture folder includes crm_notes

- **WHEN** a golden fixture folder exists under `fixtures/`
- **THEN** it contains `crm_notes.csv` with headers matching `SHEET_HEADERS.crm_notes`

### Requirement: Job notes services and hook integration

The system SHALL provide `fetchJobNotes`, `createJobNote`, `updateJobNote`, and `deleteJobNote` using the same repository patterns as client notes, reading and writing `crm_notes` rows scoped to `entity_type` `job`. The system SHALL provide `useCrmNotes` with query key `['crm_notes', spreadsheetId]`; job detail SHALL obtain job-scoped notes by filtering or adapting from that data or equivalent.

#### Scenario: Job detail loads notes with spreadsheet

- **WHEN** job detail mounts with a valid spreadsheet id
- **THEN** CRM notes data for the workbook is available and job-scoped notes can be shown for that job

### Requirement: Job detail CRM notes UI

On `/jobs/:jobId`, the system SHALL render a CRM notes section equivalent in behavior to client detail notes: filter to rows with `entity_type` `job` and `entity_id` equal to the route job id, add/edit/delete, severity strip for prominent severities, and shared mention linkify for note bodies using in-memory clients, jobs, and pieces. User-visible strings for job-scoped copy SHALL use the `jobDetail` i18n namespace (or equivalent keys).

#### Scenario: User adds a job note

- **WHEN** user saves a new note on job detail
- **THEN** a `crm_notes` row is created with entity_type `job`, the correct `entity_id`, and the list updates

### Requirement: Job detail tag UI

On `/jobs/:jobId`, the system SHALL allow viewing tags linked with `entity_type` `job` and `entity_id` equal to the job id, adding tags via the same tag pool as clients (reuse existing `tags` rows), creating new tags when needed, and removing links. Tag name matching when adding by typed name SHALL follow the same case-insensitive trimmed equality policy as on client detail so duplicate tag rows are not created for the same canonical name.

#### Scenario: User links an existing tag to a job

- **WHEN** user commits a tag that already exists by name
- **THEN** the system links the existing `tag_id` without creating a second `tags` row

## ADDED Requirements from change improve-job-fields

### Requirement: Pieces table supports inline editing of name
The system SHALL allow inline editing of the piece `name` field. Clicking the name cell SHALL transform it into a text input. The value SHALL be saved on blur. Empty values SHALL be rejected and the previous value restored.

#### Scenario: Piece name edited inline
- **WHEN** the user clicks a piece name, changes it to "New Name", and blurs
- **THEN** the piece name is updated in the workbook store

#### Scenario: Empty name rejected
- **WHEN** the user clears a piece name and blurs
- **THEN** the name reverts to its previous value

### Requirement: Pieces table supports inline editing of status
The system SHALL allow inline editing of the piece `status` field using a `Combobox` with options `pending`, `done`, `failed`. Selection SHALL trigger the same `updatePieceStatus` flow with inventory confirmation dialogs.

#### Scenario: Piece status changed inline
- **WHEN** the user selects "done" from the status dropdown in a piece row
- **THEN** the status updates with the same confirmation dialog behavior as today

### Requirement: Pieces table supports inline editing of units
The system SHALL allow inline editing of the piece `units` field using a number input. The value SHALL be saved on blur. Only positive integers SHALL be accepted.

#### Scenario: Piece units edited inline
- **WHEN** the user changes units to 3 and blurs
- **THEN** the piece units is updated

### Requirement: Piece items support inline editing of quantity
The system SHALL allow inline editing of `piece_item.quantity` using a number input. The value SHALL be saved on blur. Only positive numbers SHALL be accepted.

#### Scenario: Piece item quantity edited inline
- **WHEN** the user changes a piece item quantity to 500 and blurs
- **THEN** the piece item quantity is updated

### Requirement: Piece items support inline editing of inventory
The system SHALL allow inline editing of `piece_item.inventory_id` using a `Combobox` populated with all active inventory items. Selecting a different inventory SHALL update the piece item.

#### Scenario: Piece item inventory changed inline
- **WHEN** the user selects "PETG Orange" from the inventory dropdown in a piece item row
- **THEN** the piece item's inventory_id is updated to "PETG Orange"

### Requirement: Duplicate inventory prevention per piece
The system SHALL prevent a piece from having two piece items referencing the same `inventory_id`. When the user attempts to select an inventory already used by another piece item of the same piece, the system SHALL reject the change, restore the previous value, and display an inline error message.

#### Scenario: Duplicate inventory rejected
- **WHEN** a piece already has a piece item for "PLA White" and the user tries to set another piece item to "PLA White"
- **THEN** the selection is rejected, the cell reverts, and an error message appears

### Requirement: Piece items support inline delete
Each piece item row SHALL display a delete button. Clicking it SHALL immediately remove the piece item from the workbook store without confirmation.

#### Scenario: Piece item deleted inline
- **WHEN** the user clicks the delete button on a piece item row
- **THEN** the piece item is removed immediately

### Requirement: Add material adds empty row instead of popup
The "Add material" action on a piece SHALL add a new empty piece item row to that piece with all editable fields ready. The inventory selector SHALL receive focus immediately so the user can begin typing. No popup dialog SHALL appear.

#### Scenario: Add material creates inline row
- **WHEN** the user clicks "Add material" on a piece
- **THEN** a new empty piece item row appears with the inventory Combobox focused

### Requirement: Piece table header layout
The pieces table header, the "Add Piece" button, and the search bar SHALL be on the same horizontal line.

#### Scenario: Header line contains controls
- **WHEN** the user views the pieces section
- **THEN** the section title, "Add Piece" button, and search input are aligned horizontally

### Requirement: Multiple pieces can be expanded simultaneously
The pieces table SHALL allow more than one piece to have its piece items expanded at the same time.

#### Scenario: Two pieces expanded
- **WHEN** the user expands piece A and then piece B
- **THEN** both pieces show their piece items simultaneously
