# entity-tagging Specification

## Purpose

Reusable tags stored in `tags` and linked to clients and jobs via `tag_links`, with registry validation, golden fixtures, and client/job detail UI for viewing and managing links without duplicate tag rows for the same canonical name.

## Requirements

### Requirement: tags sheet stores tag definitions

The system SHALL persist tag definitions in a `tags` sheet with header columns in order: `id`, `name`, `created_at`. Each row SHALL represent one reusable tag. Tag ids SHALL use an auto-incrementing `TG` prefix (TG1, TG2, …). The `name` SHALL be non-empty plain text when created via the app.

#### Scenario: Tag row structure

- **WHEN** a tag is stored in the sheet
- **THEN** it includes id, name, and created_at

#### Scenario: Tag id uses TG prefix

- **WHEN** the system creates a new tag
- **THEN** the assigned id begins with `TG` and is unique among tag rows

### Requirement: tag_links sheet associates tags with entities

The system SHALL persist associations in a `tag_links` sheet with header columns in order: `id`, `tag_id`, `entity_type`, `entity_id`, `created_at`. Each row SHALL link one tag to one entity. Link ids SHALL use an auto-incrementing `TL` prefix (TL1, TL2, …). The `entity_type` SHALL be a lowercase string drawn from an application-defined set (including at least `client` and `job`). The `entity_id` SHALL be the canonical id of that entity in its primary sheet (e.g. `CL3` for a client, `J1` for a job).

#### Scenario: Link row ties tag to client

- **WHEN** a user assigns tag TG1 to client CL2
- **THEN** a tag_links row exists with tag_id TG1, entity_type `client`, and entity_id CL2

#### Scenario: Link row ties tag to job

- **WHEN** a user assigns tag TG1 to job J1
- **THEN** a tag_links row exists with tag_id TG1, entity_type `job`, and entity_id J1

#### Scenario: Duplicate link prevented or no-op

- **WHEN** the user attempts to assign the same tag to the same client again
- **THEN** the system does not create a second identical link row

### Requirement: tags and tag_links registered in sheet config

The system SHALL register `tags` and `tag_links` in the same sheet registry as other entities (`SHEET_NAMES`, `SHEET_HEADERS`). New spreadsheets created by the app SHALL include both tabs with header rows. `validateStructure` SHALL treat missing or malformed `tags` or `tag_links` tabs like other required sheets when those sheets are required for the connected workbook version.

#### Scenario: New spreadsheet includes tags sheets

- **WHEN** the app creates a new spreadsheet
- **THEN** the workbook contains `tags` and `tag_links` sheets with the expected headers

### Requirement: Client-scoped tag UI on client detail

The system SHALL allow authenticated users on `/clients/:clientId` to view tags linked to that client, add an existing tag or create a new tag name, and remove a link to a tag. The add flow SHALL use a single writable combobox: on focus, show all tags not yet linked (scrollable list); while typing, filter suggestions; on submit, if the trimmed text matches an existing tag name case-insensitively, link that tag without creating a duplicate `tags` row. All user-visible strings SHALL use i18n.

#### Scenario: User sees client tags

- **WHEN** client detail loads for a client that has tag links
- **THEN** the UI lists the linked tag names (or equivalent)

#### Scenario: User removes a tag from client

- **WHEN** user removes a tag link for that client
- **THEN** the corresponding tag_links row is deleted and the UI updates

### Requirement: Job-scoped tag UI on job detail

The system SHALL allow authenticated users on `/jobs/:jobId` to view tags linked with `entity_type` `job`, add or create tags from the same global `tags` pool, and remove links, with the same combobox and name-reuse behavior as on client detail. User-visible labels for this surface SHALL use i18n (e.g. `jobDetail` keys).

#### Scenario: User sees job tags

- **WHEN** job detail loads for a job that has job tag links
- **THEN** the UI lists the linked tag names (or equivalent)
