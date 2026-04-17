# workbook-snapshot Specification

## Purpose

Define the in-memory workbook snapshot: Zustand store as the single source of truth for tabular data, hydration on shop open, Refresh and Save orchestration, dirty tracking with `beforeunload`, and in-memory-only domain mutations until Save.

## Requirements

### Requirement: Workbook snapshot store holds all tab data

The system SHALL maintain an in-memory workbook store (Zustand) containing the parsed row data for every tab in `SHEET_NAMES` (which includes `lots` and excludes `expenses`). The store SHALL be the **single source of truth** for all UI reads (list pages, detail pages, global search). No component or hook SHALL issue backend reads (Sheets API or CSV) for tabular data outside of the hydrate, Refresh, and Save flows.

#### Scenario: Store contains all tabs after hydration

- **WHEN** a shop is successfully opened (metadata validated, structure validated)
- **THEN** the workbook store contains row arrays for every tab in `SHEET_NAMES` (including `lots`)
- **AND** does NOT contain an `expenses` tab
- **AND** each array matches the data returned by `readRows` for that tab

#### Scenario: Components read from the store

- **WHEN** a list page or detail page renders entity data
- **THEN** it reads from the workbook store (or a selector/hook derived from it)
- **AND** no `SheetsRepository.readRows` call is made to the backend

### Requirement: Workbook hydration on shop open

The system SHALL hydrate the workbook store immediately after a shop passes metadata and structure validation. Hydration SHALL call `readRows` for every tab in `SHEET_NAMES` (in parallel where possible) and populate the store. Until hydration completes, the app SHALL show a loading state. If hydration fails, the app SHALL show an error and NOT populate the store with partial data.

#### Scenario: Successful hydration after shop open

- **WHEN** the setup wizard completes (create or open)
- **AND** metadata and structure validation pass
- **THEN** the system reads all tabs from the backend and populates the workbook store
- **AND** the UI transitions from loading to ready

#### Scenario: Hydration failure

- **WHEN** any tab read fails during hydration
- **THEN** the workbook store is NOT populated with partial data
- **AND** the user sees an error with a retry option

### Requirement: Refresh reloads workbook from backend

The system SHALL provide a **Refresh** action that re-reads the workbook from the active backend (Google Sheets or local CSV), re-runs structure validation, and **replaces** the entire in-memory snapshot. Any unsaved in-app edits SHALL be discarded. If the snapshot is dirty, the system SHALL prompt the user for confirmation before proceeding.

#### Scenario: Refresh replaces snapshot

- **WHEN** the user triggers Refresh
- **AND** the snapshot is clean (no unsaved edits)
- **THEN** the system re-reads all tabs from the backend
- **AND** replaces the workbook store contents

#### Scenario: Refresh prompts when dirty

- **WHEN** the user triggers Refresh
- **AND** the snapshot has unsaved edits
- **THEN** the system shows a confirmation dialog warning that unsaved changes will be lost
- **AND** proceeds only if the user confirms

#### Scenario: Refresh cancelled

- **WHEN** the user cancels the Refresh confirmation
- **THEN** the workbook store remains unchanged

### Requirement: Save persists workbook to backend

The system SHALL provide a **Save** action that writes the current in-memory workbook to the active backend. Save SHALL write **all tabs** (not only dirty ones). Save SHALL overwrite the persisted representation without comparing to the last read (v1 -- no conflict detection). Save SHALL show progress feedback and surface errors.

#### Scenario: Save writes all tabs

- **WHEN** the user triggers Save
- **THEN** the system writes every tab from the workbook store to the backend
- **AND** marks the snapshot as clean after success

#### Scenario: Save error is surfaced

- **WHEN** a write fails during Save (e.g. network error, Sheets quota)
- **THEN** the user sees an error message
- **AND** the snapshot remains marked as dirty

### Requirement: Dirty tracking and beforeunload guard

The system SHALL track whether the in-memory workbook has been modified since the last hydration or Save. When the snapshot is dirty and the user attempts to close the browser tab or trigger a page refresh, the system SHALL show a `beforeunload` browser warning. Confirmed close/refresh loses unsaved data.

#### Scenario: Dirty flag set on mutation

- **WHEN** any in-memory mutation (create, update, archive, soft-delete) modifies the workbook store
- **THEN** the dirty flag is set to true

#### Scenario: Dirty flag cleared on Save

- **WHEN** Save completes successfully
- **THEN** the dirty flag is set to false

#### Scenario: Dirty flag cleared on Refresh

- **WHEN** Refresh completes successfully
- **THEN** the dirty flag is set to false

#### Scenario: beforeunload fires when dirty

- **WHEN** the snapshot is dirty
- **AND** the user attempts to close the tab or press F5
- **THEN** the browser shows a "you have unsaved changes" warning

### Requirement: All mutations operate in memory only

All domain services (create, update, archive, soft-delete entities) SHALL modify the workbook store only. They SHALL NOT call `SheetsRepository.readRows`, `appendRows`, `updateRow`, or `deleteRow` against the backend. Row indices, next IDs, and entity lookups SHALL be derived from the in-memory store.

#### Scenario: Creating a client does not call backend

- **WHEN** the user creates a new client
- **THEN** the new row is added to the workbook store's clients array
- **AND** no backend write occurs until the user triggers Save

#### Scenario: Service uses store for row index

- **WHEN** a mutation needs a row index (e.g. to update a specific row)
- **THEN** it derives the index from the in-memory array position
- **AND** does not call `readRows` on the backend

### Requirement: Per-route connect and validateStructure are removed

The system SHALL NOT call `connect` or `validateStructure` on every route mount. Structure validation SHALL occur only during shop open and Refresh. Pages SHALL NOT render a per-page `ConnectionStatus` tied to repeated validation calls.

#### Scenario: Navigating between pages does not trigger validation

- **WHEN** the user navigates from `/clients` to `/jobs`
- **THEN** no `validateStructure` or `connect` call is made
- **AND** no backend read occurs

### Requirement: Backend parity for snapshot semantics

The workbook snapshot, Refresh, Save, dirty tracking, and `beforeunload` guard SHALL behave identically for `GoogleSheetsRepository`, `LocalSheetsRepository`, and `CsvSheetsRepository` (dev fixtures). The snapshot layer SHALL use the `SheetsRepository` interface without branching on backend type.

#### Scenario: Local CSV uses same snapshot flow

- **WHEN** the active backend is local CSV
- **THEN** shop open hydrates, Refresh re-reads CSVs, Save rewrites CSVs
- **AND** the UX is identical to Google Sheets mode
