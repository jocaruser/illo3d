# job-detail Specification

## Purpose

Job-scoped CRM notes and tags on `/jobs/:jobId`, using the unified `crm_notes` sheet and shared mention and severity patterns with client detail, alongside the existing job summary header and pieces workflows defined elsewhere.

## Requirements

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
