# ADR-0011: Archive freezes; delete never happened

- Status: Accepted
- Date: 2026-07-18
  *(rewritten the same day on review —
  archive previously hid rows from lists,
  and delete claimed to be reversible in principle; both wrong)*

## Context

The shop's records are business history,
kept in storage the user owns and can read raw
(a Google Sheet or CSV files in a folder — see ADR-0002).
The product needs one honest "remove" story:
tidying must never quietly change what a total means,
and nothing half-removed may litter the pages.

## Decision

Every domain record is in exactly one of three states —
**active**, **archived**, **deleted** —
and moves only forwards, active → archived → deleted,
with a single step back: un-archive.

### Archive is a freeze, not a hiding

- An archived record stays visible everywhere it would appear —
  struck through and read-only
  ([how tables show it](../shared/table.spec.md)) —
  and its own page offers Un-archive and Delete
  ([lifecycle](../shared/lifecycle.spec.md)).
- Money does not move:
  an archived job's income still counts in every total,
  exactly as before.
  Only the open-work surfaces —
  the active-jobs count, expected benefit,
  the board, the calendar —
  leave archived out: frozen work is no longer open work.
- Archiving cascades down ownership and causation:
  a client's jobs, a job's pieces and their material lines,
  every entity's notes and tag links,
  and the income transactions a job caused.
- Un-archiving brings back the one record;
  its children return deliberately, one by one.

### Delete means it never happened

- Only an archived record can be deleted, and there is no undo.
- In the app's eyes the record never existed:
  repositories drop deleted rows before anything else runs
  ([ADR-0012](ADR-0012-repositories-filter-deleted.md)),
  so no page, total, search or link can ever meet one.
- Deletion cascades along the same edges as archiving,
  and takes the connections too:
  deleting a job deletes the income it produced;
  deleting a material deletes its lots
  and the material lines of every piece that used it —
  the pieces survive, one line shorter.
- Nothing dangles: surviving pages simply show less —
  never a gap, a placeholder, a struck-through ghost,
  or a "Deleted entity" label.
  A record that merely pointed at a removed one
  (a purchase naming a client, say)
  keeps everything of its own; the pointer just empties.
- The audit log is the one trace, and it names no names:
  "a Job was removed", "a Piece was removed" — the kind, only.
  Its older entries still read as they were written,
  from what they stored at the time;
  nothing ever looks a deleted record up again.
- The row itself stays in the Sheet or the CSV, flagged —
  the user's own files keep their full history —
  but that is storage's business, invisible in the app.

### What cascades where

The edges, from [schema.dbml](../technical/database-model/schema.dbml):

| Removing a | Takes with it |
|---|---|
| Client | Its jobs (and all a job takes), its notes and tag links |
| Job | Its pieces and their material lines, its notes and tag links, and the income transactions it caused |
| Piece | Its material lines |
| Material | Its purchase lots, and every piece's material line that used it |
| Purchase | Its lots |
| Tag | Its links to every entity |

Stored figures are not recomputed:
deleting a purchase does not rewrite a material's stock level —
stock corrections exist for that.

## Consequences

- Deletion is heavyweight and honest:
  two deliberate steps, and afterwards the shop reads
  as if the work never was — its money included.
- Archived clutter stays in sight, struck through;
  whoever wants it truly gone has delete.
- The audit log is deliberately the only memory of deletions,
  and even it names nothing.
- The code lags this decision in several places;
  the gaps are queued in [the tracker](../README.md).
