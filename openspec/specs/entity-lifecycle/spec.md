# entity-lifecycle Specification

## Purpose

Define archive and soft-delete semantics for workbook rows: `archived` and `deleted` columns, UI visibility and read-only rules, cascade behavior, global search exclusion, and persistence via Save.

## Requirements

### Requirement: Entity rows carry archive and soft-delete flags

Every first-class entity tab (clients, jobs, pieces, inventory, expenses, transactions, crm_notes, tags, tag_links, piece_items) SHALL include two lifecycle columns: `archived` and `deleted`. Both columns SHALL be string-valued (`"true"` or empty/absent). The columns SHALL be appended to `SHEET_HEADERS` for each tab. `validateStructure` SHALL require these columns in compliant workbooks.

#### Scenario: New workbook includes lifecycle columns

- **WHEN** a new shop is created
- **THEN** every tab's header row includes `archived` and `deleted` columns
- **AND** all data rows have those columns empty by default

#### Scenario: Existing workbook without columns fails validation

- **WHEN** a workbook lacks `archived` or `deleted` columns on any tab
- **THEN** `validateStructure` reports a validation error
- **AND** the shop cannot be opened

### Requirement: Archived entities are read-only and hidden from discovery

An entity with `archived` set to `"true"` SHALL be **read-only** in the UI (no edit, no further mutations except soft-delete or un-archive). Archived entities SHALL be **excluded** from global search results and from **main list views** (e.g. `/clients`, `/jobs`). Direct navigation to the entity's detail route SHALL still work and display the entity in read-only mode.

**Exception -- parent detail pages:** When a parent entity's detail page includes an embedded table of children (e.g. client detail shows a jobs table), **archived children SHALL still appear** in that embedded table but rendered with **strikethrough styling** to visually indicate their archived state. This allows the user to see the full history of a parent's children without navigating away. Archived children in embedded tables SHALL remain **read-only** (no Edit action) but MAY offer an **Un-archive** action. Soft-deleted children SHALL also appear with strikethrough styling but show their name as **"Deleted entity"** (i18n).

#### Scenario: Archived client hidden from clients list

- **WHEN** a client has `archived: "true"`
- **THEN** the clients list page (`/clients`) does not show that client by default

#### Scenario: Archived client hidden from global search

- **WHEN** a client has `archived: "true"`
- **AND** the user types a query matching that client's name
- **THEN** global search does not include that client in results

#### Scenario: Archived client accessible via direct URL

- **WHEN** a client has `archived: "true"`
- **AND** the user navigates to `/clients/:clientId`
- **THEN** the client detail page renders in read-only mode

#### Scenario: Archived entity cannot be edited

- **WHEN** an entity is archived
- **THEN** edit controls are not available on its detail page or list row

#### Scenario: Archived jobs visible in client detail page

- **WHEN** a client has active and archived jobs
- **AND** the user views the client detail page
- **THEN** both active and archived jobs appear in the embedded jobs table
- **AND** archived jobs are rendered with strikethrough styling
- **AND** archived jobs do not have Edit actions

#### Scenario: Soft-deleted jobs visible in client detail page with "Deleted entity"

- **WHEN** a client has soft-deleted jobs
- **AND** the user views the client detail page
- **THEN** soft-deleted jobs appear in the embedded jobs table with strikethrough styling
- **AND** their name/label shows "Deleted entity" (i18n)

### Requirement: Inbound links to archived entities resolve normally

Inbound references from other entities (links, breadcrumbs, joined labels) to an **archived** entity SHALL display the entity's **real name** and link to its detail route (which works in read-only mode). This applies in detail pages, notes, and any cross-entity reference. Only **soft-deleted** entities get the "Deleted entity" replacement label.

#### Scenario: Inbound link to archived client shows real name

- **WHEN** a job references a client that has `archived: "true"` (but not soft-deleted)
- **AND** the job detail page renders the client name
- **THEN** the display shows the client's actual name
- **AND** the link navigates to the client detail page (read-only)

### Requirement: Soft-deleted entities return not-found on own detail route

An entity with `deleted` set to `"true"` SHALL have all archive behaviors (read-only, hidden from search and lists) **and additionally**: navigating to the entity's own detail route SHALL render a **not-found** state (SPA 404). Inbound references from other entities (links, breadcrumbs, labels) SHALL display **"Deleted entity"** (i18n key) instead of the entity's name.

#### Scenario: Soft-deleted job detail shows not-found

- **WHEN** a job has `deleted: "true"`
- **AND** the user navigates to `/jobs/:jobId`
- **THEN** the page renders a not-found / 404 state

#### Scenario: Inbound link to soft-deleted client shows label

- **WHEN** a job references a client that has `deleted: "true"`
- **AND** the job detail page renders the client name
- **THEN** the display shows the i18n "Deleted entity" label instead of the client's name

#### Scenario: Soft-deleted entity excluded from search

- **WHEN** an entity has `deleted: "true"`
- **THEN** global search does not include it in results

### Requirement: Archive is prerequisite to soft-delete

Soft delete SHALL only be available for entities that are **already archived**. The soft-delete action SHALL NOT be offered on active (non-archived) entities.

#### Scenario: Active entity has no soft-delete option

- **WHEN** an entity is not archived
- **THEN** only Archive is available; Soft Delete is not shown

#### Scenario: Archived entity can be soft-deleted

- **WHEN** an entity is archived (but not soft-deleted)
- **AND** the user views the entity's detail page
- **THEN** a Soft Delete action is available

### Requirement: Archive replaces hard delete in UI

Today's "Delete" actions in list tables and detail pages SHALL become **Archive**. Physical row removal SHALL be removed from the UI. The archive action SHALL be available from **list table rows** and from the **entity detail page**.

#### Scenario: List table row shows Archive instead of Delete

- **WHEN** a list table renders actions for an active entity row
- **THEN** the action is labeled Archive (i18n), not Delete

#### Scenario: Detail page shows Archive for active entity

- **WHEN** the user views the detail page of an active entity
- **THEN** an Archive action is available in the action area

#### Scenario: No hard-delete action exists

- **WHEN** the user views any entity list or detail
- **THEN** there is no action that physically removes a row from the workbook

### Requirement: Soft delete available only from detail page

The soft-delete action SHALL be available **only on the entity detail page** of an already-archived entity. It SHALL NOT appear in list table rows.

#### Scenario: Detail page of archived entity shows soft-delete

- **WHEN** the user navigates to the detail page of an archived entity
- **THEN** a Soft Delete action is available

#### Scenario: List row of archived entity has no soft-delete

- **WHEN** an archived entity appears in a list (e.g. via future "show archived" filter)
- **THEN** the row does NOT offer a Soft Delete action

### Requirement: Cascade archive and soft-delete to children

Archiving or soft-deleting a parent entity SHALL cascade the same status to its children. The parent-child relationships are: client -> jobs; job -> pieces, piece_items, crm_notes (entity_type=job), tag_links (entity_type=job); piece -> piece_items. Cascaded children follow the same visibility rules as directly archived/deleted entities. **Un-archiving a parent does NOT un-archive children** -- each child must be restored individually.

#### Scenario: Archiving a client cascades to jobs

- **WHEN** the user archives a client
- **THEN** all jobs with `client_id` matching that client are also archived
- **AND** each job's children (pieces, piece_items, notes, tag_links) are also archived

#### Scenario: Soft-deleting a job cascades to pieces

- **WHEN** the user soft-deletes an archived job
- **THEN** all pieces for that job are also soft-deleted
- **AND** piece_items for those pieces are also soft-deleted

#### Scenario: Un-archiving a parent does not un-archive children

- **WHEN** the user un-archives a client
- **THEN** the client becomes active
- **AND** its jobs remain archived until individually un-archived

### Requirement: Lifecycle flags persist via snapshot Save

Archive and soft-delete flags are ordinary columns in the workbook store. Setting or clearing them is an in-memory mutation like any other. The flags SHALL be persisted when the user triggers Save and reloaded on Refresh or shop open.

#### Scenario: Archive flag survives Save and Refresh

- **WHEN** the user archives a client and then Saves
- **AND** the user later Refreshes
- **THEN** the client still has `archived: "true"` in the workbook store

### Requirement: No anonymisation or physical removal

Archived and soft-deleted rows SHALL remain in Google Sheets / CSV and in the in-memory snapshot. The system SHALL NOT anonymise field values, strip columns, or filter deleted rows out of persisted storage. Visibility is application-layer only.

#### Scenario: Soft-deleted row persists in spreadsheet

- **WHEN** an entity is soft-deleted and the user Saves
- **THEN** the row remains in the spreadsheet/CSV with all original field values plus `deleted: "true"`

### Requirement: Lifecycle action labels use i18n

All lifecycle action labels (Archive, Soft Delete, Un-archive, "Deleted entity" display label) SHALL use i18n keys for English and Spanish.

#### Scenario: Archive label in Spanish

- **WHEN** the UI locale is Spanish
- **THEN** the Archive action label is the Spanish translation
