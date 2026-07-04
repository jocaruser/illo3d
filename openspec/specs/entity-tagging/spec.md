# entity-tagging Specification

## Purpose

Reusable tags stored in `tags` and linked to clients and jobs via `tag_link` events in the `audit_log`, with registry validation, golden fixtures, and client/job detail UI for viewing and managing links without duplicate tag rows for the same canonical name.

## Requirements

### Requirement: tags sheet stores tag definitions

The system SHALL persist tag definitions in a `tags` sheet with header columns in order: `id`, `name`, `created_at`, `archived`, `deleted`. Each row SHALL represent one reusable tag. Tag ids SHALL use an auto-incrementing `TG` prefix (TG1, TG2, …). The `name` SHALL be non-empty plain text when created via the app.

#### Scenario: Tag row structure

- **WHEN** a tag is stored in the sheet
- **THEN** it includes id, name, created_at, archived, and deleted

#### Scenario: Tag id uses TG prefix

- **WHEN** the system creates a new tag
- **THEN** the assigned id begins with `TG` and is unique among tag rows

### Requirement: Tag links are stored in audit_log

The system SHALL persist tag associations as events in the `audit_log` sheet with entity_name="tag_link". Each tag assignment creates an audit entry with action="create" and after_json containing the tag_link data (tag_id, entity_type, entity_id). Each tag removal creates an audit entry with action="delete" and before_json containing the tag_link data. The `tag_links` sheet is no longer present.

#### Scenario: Tag assignment creates audit event

- **WHEN** a user assigns tag TG1 to client CL2
- **THEN** an audit entry is created with entity_name="tag_link"
- **AND** action="create"
- **AND** after_json contains {tag_id: "TG1", entity_type: "client", entity_id: "CL2"}

#### Scenario: Tag removal creates audit event

- **WHEN** a user removes tag TG1 from client CL2
- **THEN** an audit entry is created with action="delete"
- **AND** before_json contains {tag_id: "TG1", entity_type: "client", entity_id: "CL2"}
- **AND** after_json is null

#### Scenario: Duplicate tag link prevented

- **WHEN** the user attempts to assign the same tag to the same client again
- **THEN** the system checks the audit log for an existing active tag_link
- **AND** if found, does not create a new audit entry

### Requirement: tags registered in sheet config

The system SHALL register `tags` in the sheet registry (`SHEET_NAMES`, `SHEET_HEADERS`). New spreadsheets created by the app SHALL include the `tags` tab with header rows. `validateStructure` SHALL treat missing or malformed `tags` tab like other required sheets. The `tag_links` sheet is no longer registered.

#### Scenario: New spreadsheet includes tags

- **WHEN** the app creates a new spreadsheet
- **THEN** the workbook contains a `tags` sheet with the expected headers
- **AND** does NOT contain a `tag_links` sheet

### Requirement: Client-scoped tag UI on client detail

The system SHALL allow authenticated users on `/clients/:clientId` to view tags linked to that client, add an existing tag or create a new tag name, and remove a link to a tag. The add flow SHALL use a single writable combobox: on focus, show all tags not yet linked (scrollable list); while typing, filter suggestions; on submit, if the trimmed text matches an existing tag name case-insensitively, link that tag without creating a duplicate `tags` row. Tag links are retrieved from the audit log by querying for entity_name="tag_link" entries where after_json contains entity_type="client" and entity_id matching the client id, then reconstructing current state. All user-visible strings SHALL use i18n.

#### Scenario: User sees client tags

- **WHEN** client detail loads for a client that has tag links
- **THEN** the system queries audit_log for active tag_links for that client
- **AND** the UI lists the linked tag names

#### Scenario: User removes a tag from client

- **WHEN** user removes a tag link for that client
- **THEN** an audit entry is created with entity_name="tag_link" and action="delete"
- **AND** the UI updates to reflect the removal

### Requirement: Job-scoped tag UI on job detail

The system SHALL allow authenticated users on `/jobs/:jobId` to view tags linked with `entity_type` `job`, add or create tags from the same global `tags` pool, and remove links, with the same combobox and name-reuse behavior as on client detail. Tag links are retrieved from the audit log. User-visible labels for this surface SHALL use i18n (e.g. `jobDetail` keys).

#### Scenario: User sees job tags

- **WHEN** job detail loads for a job that has job tag links
- **THEN** the system queries audit_log for active tag_links for that job
- **AND** the UI lists the linked tag names

## REMOVED Requirements

### Requirement: tag_links sheet associates tags with entities

**Reason**: Tag links are now stored as events in the `audit_log` sheet with entity_name="tag_link". This provides full history of tag assignments and removals automatically.

**Migration**: Existing `tag_links` data is migrated to `audit_log` as create events during the v2.0.0 migration.
