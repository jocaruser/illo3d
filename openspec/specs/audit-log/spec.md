# audit-log Specification

## Purpose

Define the immutable audit log that records every entity mutation in the workbook, enabling history inspection, cascade tracking, and data reconstruction for notes and tag links.

## Requirements

### Requirement: Audit log table stores all entity mutations

The system SHALL persist an `audit_log` sheet with header columns in order: `id`, `timestamp`, `actor`, `entity_name`, `entity_id`, `action`, `before_json`, `after_json`, `parent_entity_name`, `parent_entity_id`. Each row SHALL represent one immutable audit event. The `entity_name` SHALL be one of: `client`, `job`, `piece`, `piece_item`, `inventory`, `lot`, `transaction`, `tag`, `tag_link`, `crm_note`. The `action` SHALL be one of: `create`, `update`, `delete`, `archive`, `unarchive`, `soft_delete`, `restore`.

#### Scenario: Audit log row structure

- **WHEN** an audit event is recorded
- **THEN** the row includes id, timestamp, actor, entity_name, entity_id, action, before_json, after_json, parent_entity_name, parent_entity_id

#### Scenario: Audit log id uses AL prefix

- **WHEN** the system creates a new audit entry
- **THEN** the assigned id begins with `AL` and is unique among audit_log rows

#### Scenario: Timestamp is ISO 8601

- **WHEN** an audit event is recorded
- **THEN** the timestamp field contains an ISO 8601 formatted string (e.g., "2024-01-15T10:30:00.000Z")

#### Scenario: Actor is user email or "local"

- **WHEN** an audit event is recorded
- **THEN** the actor field contains the authenticated user's email address
- **AND** if no user is authenticated (local mode), the actor is "local"

### Requirement: Audit log captures full before/after snapshots

For `create` actions, `before_json` SHALL be null and `after_json` SHALL contain the full row state as JSON. For `update` actions, both `before_json` and `after_json` SHALL contain the full row state before and after the mutation. For `delete` actions, `before_json` SHALL contain the full row state and `after_json` SHALL be null. For `archive`, `unarchive`, `soft_delete`, and `restore` actions, both fields SHALL contain the full row state.

#### Scenario: Create action has null before_json

- **WHEN** a new client is created
- **THEN** the audit entry has action="create"
- **AND** before_json is null
- **AND** after_json contains the full client row as JSON

#### Scenario: Update action has both snapshots

- **WHEN** a job's status is changed from "draft" to "in_progress"
- **THEN** the audit entry has action="update"
- **AND** before_json contains the job state with status="draft"
- **AND** after_json contains the job state with status="in_progress"

#### Scenario: Delete action has null after_json

- **WHEN** a piece is deleted
- **THEN** the audit entry has action="delete"
- **AND** before_json contains the full piece row as JSON
- **AND** after_json is null

#### Scenario: Archive action has both snapshots

- **WHEN** an inventory item is archived
- **THEN** the audit entry has action="archive"
- **AND** before_json contains the inventory state with archived=""
- **AND** after_json contains the inventory state with archived="true"

### Requirement: Cascade operations are tracked via parent fields

When a cascade operation occurs (e.g., archiving a client cascades to jobs, pieces, etc.), each cascaded audit entry SHALL have `parent_entity_name` and `parent_entity_id` set to the entity that triggered the cascade. Root operations (not part of a cascade) SHALL have null values for both parent fields.

#### Scenario: Root operation has null parent fields

- **WHEN** a user directly archives a job
- **THEN** the audit entry has parent_entity_name=null
- **AND** parent_entity_id=null

#### Scenario: Cascaded operation references parent

- **WHEN** archiving a client cascades to archive its jobs
- **THEN** each job's audit entry has parent_entity_name="client"
- **AND** parent_entity_id set to the client's id

#### Scenario: Multi-level cascade tracks immediate parent

- **WHEN** archiving a client cascades to jobs, which cascade to pieces
- **THEN** the job audit entries have parent_entity_name="client"
- **AND** the piece audit entries have parent_entity_name="job"
- **AND** parent_entity_id set to the job's id (not the client's)

### Requirement: Audit log is immutable

Once an audit entry is written, it SHALL NOT be modified or deleted. Each mutation creates a new audit entry. Editing a note, for example, creates a new audit entry with action="update" rather than modifying the original "create" entry.

#### Scenario: Note edit creates new audit entry

- **WHEN** a CRM note is edited
- **THEN** a new audit entry is created with action="update"
- **AND** the original "create" audit entry remains unchanged

#### Scenario: Multiple edits create multiple entries

- **WHEN** a CRM note is edited three times
- **THEN** the audit log contains four entries for that note: one "create" and three "update"

### Requirement: Notes and tag_links are stored in audit_log

The system SHALL NOT maintain separate `crm_notes` or `tag_links` sheets. Instead, notes and tag links SHALL be represented as events in the `audit_log` sheet. To retrieve current notes for an entity, the system SHALL query the audit log for entries where entity_name="crm_note" and entity_id matches, then reconstruct current state from the latest entry per note id.

#### Scenario: Note creation is an audit event

- **WHEN** a user creates a CRM note
- **THEN** an audit entry is created with entity_name="crm_note"
- **AND** action="create"
- **AND** after_json contains the note data (entity_type, entity_id, body, severity, etc.)

#### Scenario: Note retrieval reconstructs from audit log

- **WHEN** the system needs current notes for client CL1
- **THEN** it queries audit_log for entries where entity_name="crm_note"
- **AND** after_json contains entity_type="client" and entity_id="CL1"
- **AND** it groups by note entity_id and takes the latest state per id
- **AND** it filters out entries where action is "archive" or "delete"

#### Scenario: Tag link creation is an audit event

- **WHEN** a user assigns a tag to a client
- **THEN** an audit entry is created with entity_name="tag_link"
- **AND** action="create"
- **AND** after_json contains the tag_link data (tag_id, entity_type, entity_id)

#### Scenario: Tag link removal is an audit event

- **WHEN** a user removes a tag from a client
- **THEN** an audit entry is created with entity_name="tag_link"
- **AND** action="delete"
- **AND** before_json contains the tag_link data
- **AND** after_json is null

### Requirement: Audit log is included in sheet configuration

The `audit_log` sheet SHALL be registered in `SHEET_NAMES` and `SHEET_HEADERS`. New spreadsheets created by the app SHALL include the `audit_log` tab with the correct header row. `validateStructure` SHALL require this sheet in compliant workbooks.

#### Scenario: New spreadsheet includes audit_log

- **WHEN** the app creates a new spreadsheet
- **THEN** the workbook contains an `audit_log` sheet
- **AND** the header row matches SHEET_HEADERS.audit_log

#### Scenario: Validation requires audit_log

- **WHEN** a workbook lacks the `audit_log` sheet
- **THEN** `validateStructure` reports a validation error
- **AND** the shop cannot be opened

### Requirement: Audit events are emitted via repository interface

The `SheetsRepository` interface SHALL include an `onAuditEvent(handler)` method that allows subscribing to audit events. Service functions SHALL emit audit events through this interface. The repository implementation SHALL persist audit events to the `audit_log` sheet.

#### Scenario: Service function emits audit event

- **WHEN** a service function (e.g., createClient) executes
- **THEN** it emits an audit event via the repository
- **AND** the event includes entity_name, entity_id, action, before_json, after_json

#### Scenario: Repository persists audit event

- **WHEN** an audit event is emitted
- **THEN** the repository appends a row to the audit_log sheet
- **AND** the row contains all event fields

#### Scenario: Multiple repository implementations handle audit events

- **WHEN** the active backend is "google-drive"
- **THEN** GoogleSheetsRepository persists audit events to Google Sheets
- **WHEN** the active backend is "local-csv"
- **THEN** LocalSheetsRepository persists audit events to a local CSV file
