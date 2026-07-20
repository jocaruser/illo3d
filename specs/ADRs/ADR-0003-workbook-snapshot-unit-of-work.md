# ADR-0003: In-memory workbook snapshot with explicit Save

- Status: Accepted
- Date: 2026-07-16

## Context

Shops are spreadsheet-shaped (one tab/CSV per entity) and live in storage the app does not
control: a Google Spreadsheet or a local folder. Per-row remote writes would be slow (Sheets
API quotas), unbatchable, and impossible to reconcile offline. v2 already established a
snapshot model; the rewrite had to decide whether to keep it.

## Decision

Keep and formalize the snapshot as the unit of work:

- Opening a shop hydrates every sheet into the `workbookStore` (raw matrices).
- All reads — lists, detail pages, search, dashboards — come from the snapshot.
- All mutations are in-memory (through entity repositories) and mark the store dirty.
- An explicit **Save** writes every sheet back through the active
  `WorkbookRepositoryInterface`; **Refresh** re-reads, confirming first when dirty.
- A `beforeunload` guard warns about unsaved changes; mutations that land while a save is
  in flight keep the store dirty.

## Consequences

- The UI is instant regardless of backend latency; the Sheets API is touched only at open,
  refresh and save.
- Last-write-wins: there is no conflict detection between concurrent editors. Acceptable for
  a single-operator shop; revisit if multi-user editing ever matters.
- Everything between hydrate and save is synchronously testable with an in-memory `TabAccess`
  fake — a large contributor to the 100% coverage gate being sustainable.
- Users must understand the applied-vs-saved distinction; the UI enforces honest language
  ("Change applied — save to persist it" vs "Workbook saved.").
