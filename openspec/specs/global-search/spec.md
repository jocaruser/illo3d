# global-search Specification

## Purpose

Define the **global header search**: a single always-visible field in the authenticated app shell that fuzzy-matches across loaded entities (clients, jobs, pieces, CRM notes, transactions, expenses, inventory, tags), ranks exact id matches first, caps suggestions, and navigates to the appropriate list or detail route—including parent routes for pieces and notes.

## Requirements

### Requirement: Global header search visibility

The system SHALL render a **global search** input in the authenticated app header whenever the user has an **active shop** and is viewing the main app shell (same surfaces as primary section navigation). The control SHALL remain **always visible** on those surfaces without replacing primary section links. The search input SHALL expose an accessible name (for example via `aria-label` or associated `<label>`) and SHALL identify itself as a search field for assistive technology.

#### Scenario: Search is visible on clients page with active shop

- **WHEN** an authenticated user has an active shop
- **AND** the user views the Clients page in the main layout
- **THEN** the global search input is visible in the header region

#### Scenario: Search is not shown on login

- **WHEN** the user views the login page
- **THEN** the global search input is not shown

### Requirement: Global search query length and activation

The system SHALL NOT run global search when the trimmed query length is **0 or 1** character. When the trimmed query length is **2 or more** characters, the system SHALL compute result suggestions. Pressing **Enter** while the search field is focused and a non-empty suggestion list is open SHALL navigate using the **first** suggestion. When the suggestion list is empty or search is not active (query length under 2), pressing Enter SHALL NOT navigate.

#### Scenario: Single character does not search

- **WHEN** the user types one non-space character in the global search field
- **THEN** the system does not show a suggestion list as if matches existed (no false-positive dropdown state)

#### Scenario: Enter opens first result

- **WHEN** the trimmed query has at least two characters
- **AND** at least one suggestion is shown
- **AND** the user presses Enter with focus in the global search field
- **THEN** the app navigates to the same route as activating the first suggestion

### Requirement: Global search entity coverage and local scope

The global search SHALL include suggestions for **clients**, **jobs**, **pieces**, **client notes**, **job notes**, **transactions**, **expenses**, **inventory items**, and **tags** when those entities are available in **local in-memory state** (TanStack Query cache or equivalent session data already loaded). The system SHALL NOT perform additional network or Sheets reads solely to populate global search.

#### Scenario: Loaded client is findable

- **WHEN** a client row exists in the local client cache
- **AND** the user enters a query of at least two characters that matches that client per the fuzzy rules
- **THEN** a client suggestion appears

#### Scenario: Unloaded dataset produces no suggestion

- **WHEN** a job exists only on the server and is not present in local session data
- **THEN** global search does not return that job

### Requirement: Global search fuzzy parity and date fragments

Global search SHALL use the same fuzzy matching rules and **ISO date / month fragment** literal matching behavior as `filterRowsBySearchQuery` / list-table discovery (including `minMatchCharLength` and date-fragment regex behavior). Search blobs SHALL include the same fields and translated label tokens as list-table indexes for those entity types so operators can find rows by hidden fields and localized labels.

#### Scenario: Typo matches like list tables

- **WHEN** indexed text includes `Acme Corp`
- **AND** the user queries `Acme Coorp` with at least two characters
- **THEN** the corresponding entity suggestion appears

#### Scenario: Month fragment matches like list tables

- **WHEN** an indexed date string contains `2026-06-15`
- **AND** the user queries `2026-06`
- **THEN** the corresponding entity suggestion appears

### Requirement: Global search ranking and result cap

The system SHALL rank any suggestion whose entity **id** equals the **trimmed query** above suggestions that match only by fuzzy text. The system SHALL show at most **10** suggestions total. Tie-breaking beyond id-first ranking SHALL be deterministic (implementation-defined sort key, for example by id).

#### Scenario: Id match beats fuzzy noise

- **WHEN** two entities would match the query
- **AND** one match is an exact id equal to the trimmed query
- **THEN** that suggestion ranks above the non-exact match

#### Scenario: Cap at ten

- **WHEN** more than ten entities match the query
- **THEN** at most ten suggestions are shown

### Requirement: Global search result presentation

Each suggestion SHALL use a **two-line** presentation: the first line shows the **entity type** in the **active UI language**; the second line shows a **primary label** (for example name, description, or id-derived label as appropriate) and, when the entity is nested under another entity, **parent context** on the same line or as a clear secondary segment (for example job title for a piece, client name for a job note). The presentation SHALL reuse the same i18n keys or patterns as list tables for type and enum labels where applicable.

#### Scenario: Piece shows job context

- **WHEN** a piece suggestion is shown
- **THEN** the type line indicates a piece
- **AND** the second line includes identifying piece text and job context sufficient to disambiguate (for example job id and/or job description label)

#### Scenario: Spanish entity type label

- **WHEN** the UI locale is Spanish
- **THEN** the entity type line uses the Spanish label for that entity kind

### Requirement: Global search note snippets

For **client note** and **job note** suggestions, when the match is attributable to note **body** text, the system SHALL include a **short snippet** of the body in the suggestion (bounded length, plain text). When the match is attributable only to non-body fields (for example id), the snippet MAY be omitted.

#### Scenario: Note body match shows snippet

- **WHEN** a note’s body contains text matching the query
- **THEN** the suggestion includes a snippet containing a substring of the body

### Requirement: Global search navigation targets

Selecting a suggestion SHALL navigate via client-side routing: **clients** → `/clients/:clientId`; **jobs** → `/jobs/:jobId`; **transactions** → `/transactions`; **expenses** → `/expenses`; **inventory** → `/inventory`. **Pieces** SHALL navigate to `/jobs/:jobId` for the piece’s `job_id`. **Client notes** SHALL navigate to `/clients/:clientId` for the note’s `client_id`. **Job notes** SHALL navigate to `/jobs/:jobId` for the note’s `job_id`. **Tags** SHALL navigate deterministically: if the tag has any link with `entity_type` client, `/clients`; else if any link with `entity_type` job, `/jobs`; else `/clients`.

#### Scenario: Piece selects parent job

- **WHEN** the user activates a piece suggestion for piece `P1` belonging to job `J4`
- **THEN** the app navigates to `/jobs/J4`

#### Scenario: Client note selects parent client

- **WHEN** the user activates a client note suggestion for client `CL2`
- **THEN** the app navigates to `/clients/CL2`

### Requirement: Global search does not affect nav active state

Interacting with the global search control SHALL NOT change which primary section link is styled as active; active section styling SHALL remain based on the **current route** only.

#### Scenario: Search focus does not activate nav link

- **WHEN** the user focuses the global search field on `/jobs`
- **THEN** the Jobs nav link remains the active section link
- **AND** no other section link takes active styling solely due to search focus
