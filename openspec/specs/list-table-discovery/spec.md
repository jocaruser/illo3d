# list-table-discovery Specification

## Purpose

Shared list discovery for in-app data tables: a single primary search field per list, fuzzy matching from two characters, a row search index that includes hidden fields and active-locale labels, date-fragment and amount-variant matching, sortable data columns with stable id tie-breaks (no URL persistence), responsive column visibility on narrow viewports, and aligned defaults such as jobs ordered by `created_at` descending until the user changes sort.

## Requirements

### Requirement: In-scope list surfaces use shared discovery controls

The system SHALL apply the list search, fuzzy matching, column sorting, and responsive column rules in this capability to the following in-app tables: `ClientsTable`, `JobsTable`, `ExpensesTable`, `TransactionsTable`, `InventoryTable`, `PiecesTable` on job detail, and the embedded jobs table on client detail (`ClientDetailPage`). Each in-scope view SHALL expose exactly **one** primary search input for that list (not per-column search boxes).

#### Scenario: Jobs list is in scope

- **WHEN** the authenticated user views `/jobs` with at least one job row
- **THEN** the jobs list presents the shared search and sort affordances described in this capability

#### Scenario: Client embedded jobs list is in scope

- **WHEN** the authenticated user views `/clients/:clientId` and the client has at least one job
- **THEN** the embedded jobs list presents the same discovery affordances as the main jobs list

### Requirement: Search applies only from two characters

For the primary search input on each in-scope list, the system SHALL NOT apply fuzzy filtering when the trimmed query length is **0 or 1** character; in those cases the visible row set SHALL be the full list prior to search (other active sort rules still apply). When the trimmed query length is **2 or more**, the system SHALL apply fuzzy matching per the indexing requirement.

#### Scenario: Single character shows all rows

- **WHEN** the user types a single non-space character in the list search field
- **THEN** all rows that would render without search remain candidates for display (subject only to sort)

#### Scenario: Two characters activate filtering

- **WHEN** the user types two characters that match no row in the index
- **THEN** the table shows an empty body (or documented empty-search state) with zero matching rows

### Requirement: Search index includes hidden fields and i18n

For each row, the system SHALL build a search index that includes **all fields** from the underlying domain model that are needed for operator discovery, **including fields not rendered as table columns** (for example transaction `notes`, `ref_id`, `ref_type`, job `client_id`, expense `id`, piece `job_id`, and inventory linkage ids where applicable). The index SHALL include **both** canonical stored tokens (e.g. enum keys) **and** user-visible translated strings for the **active UI locale** for columns that use i18n in the table (for example transaction type and expense category labels).

#### Scenario: Hidden transaction notes match

- **WHEN** a transaction row has non-empty `notes` not shown as a table column
- **AND** the user enters a query of at least two characters that appears only in `notes`
- **THEN** that transaction row is included in the filtered results

#### Scenario: Spanish type label matches

- **WHEN** the UI locale is Spanish
- **AND** the user searches for a substring of the Spanish label for an income transaction
- **THEN** matching income rows are included in the filtered results

### Requirement: Fuzzy matching strength

The system SHALL use a fuzzy matching configuration such that minor typographical differences between query and indexed text still match (for example a one-character typo in a client name), and such that queries that are not a reasonable fuzzy match for a row do not match (for example a high-edit-distance random string vs a short business name). Exact threshold tuning is implementation-defined but MUST be covered by unit tests derived from the change design matrix.

#### Scenario: Reasonable typo matches

- **WHEN** indexed text contains `Acme Corp`
- **AND** the user queries `Acme Coorp` with at least two characters
- **THEN** the corresponding row matches

#### Scenario: Unreasonable query does not match

- **WHEN** indexed text contains `Acme Corp`
- **AND** the user queries `Xmee`
- **THEN** that row does not match

### Requirement: Date substring search without range pickers

The system SHALL NOT introduce dedicated from/to date-range filter controls in this change. The search index SHALL still allow users to find rows by typing date fragments that are substrings of normalized indexed date text (for example `2026-06` matching rows whose `created_at` or `date` field string contains that substring). The system SHALL NOT add indexing logic whose sole purpose is to synthesize European slash date formats (for example `15/06/2026`) from ISO fields; if such strings appear only because existing formatting paths already emit them, matches are acceptable.

#### Scenario: Month fragment matches created date

- **WHEN** a row’s `created_at` string is `2026-06-15`
- **AND** the user queries `2026-06`
- **THEN** that row matches

#### Scenario: Non-matching month does not match

- **WHEN** a row’s `created_at` string is `2026-06-15`
- **AND** the user queries `2026-05`
- **THEN** that row does not match

### Requirement: Numeric amount search variants

The search index SHALL include normalized textual forms of monetary fields so that common query variants match the same logical amount where applicable: decimal dot form, decimal comma form when used in queries, and trailing-zero equivalence (for example `100` vs `100.00` for a job price). The exact normalization approach is implementation-defined but MUST satisfy the unit tests derived from the design matrix (cases D1–D3).

#### Scenario: Dot decimal query matches amount

- **WHEN** a row has amount `123.45` in its indexed numeric text
- **AND** the user queries `123.45`
- **THEN** that row matches

### Requirement: Column sorting with stable id tie-break

For each in-scope table, the system SHALL provide sort affordances on **every data column** (headers or equivalent). **Actions** columns (edit/delete and similar controls) SHALL NOT be sortable. When two rows compare equal for the active sort key, the system SHALL break ties using the row’s stable string **`id`** for that entity type. Sorting interactions SHALL not persist to URL query parameters.

#### Scenario: Actions header does not change sort mode

- **WHEN** the user activates only the actions region for a row
- **THEN** the table’s sort mode does not change because of that interaction

### Requirement: Jobs default sort remains created_at descending

For the `/jobs` list and the embedded jobs list on client detail, the **initial** active sort before explicit user interaction SHALL order rows by `created_at` descending, consistent with prior product behavior. After the user selects a different column sort, that choice SHALL apply until changed again or the view is reset per implementation (e.g. navigation remount).

#### Scenario: Fresh jobs page uses created_at descending

- **WHEN** an authenticated user opens `/jobs` and has not changed sort on that visit
- **THEN** rows are ordered by `created_at` descending using stable id tie-breaks where timestamps collide

### Requirement: Responsive essential columns on small viewports

On narrow viewports, the system SHALL hide non-essential columns using responsive CSS so that each in-scope table keeps a small set of always-visible columns (including the primary navigation link and actions where the table has actions). Hidden columns remain searchable and sortable via their header on wider breakpoints per implementation; the system SHALL preserve the product rule that users can open detail pages from visible primary links.

#### Scenario: Small viewport hides at least one non-essential column

- **WHEN** the viewport width is below the chosen `md` breakpoint for a table that defines non-essential columns
- **THEN** at least one non-essential column is not displayed while primary columns remain visible
