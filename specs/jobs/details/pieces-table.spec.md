# A job's pieces

The making, piece by piece.
"Add piece" asks a name and, optionally, a per-unit price;
new pieces start Pending.
A piece missing its units count is highlighted amber —
it blocks the job's total
([pricing](../../shared/pricing.spec.md))
and cannot be completed.

Each row edits in place:

| Column | Notes |
|---|---|
| ID | |
| Name | Emptying it is refused |
| Units | A whole number, at least one |
| Price / unit | Zero allowed (a gift); beside it, the suggestion — see below |
| Line total | units × price, when both are set |
| Benefit | The line's revenue minus its material cost |
| Stock / redo | The run's margin — green ≥ 2 redos, amber 1, red 0 |
| Status | Pending / Done / Failed, picked with [the dropdown](../../shared/dropdown.spec.md) — see the scenarios |
| Created | |

**The suggested price** — "Use ‹price› / unit" —
is the piece's material cost times three,
a starting point, not a rule
([pricing](../../shared/pricing.spec.md)).
It appears only when every material's cost is known.

## Material lines

A piece expands to its materials:
each line names a material
(picked from live stock — "‹name› (‹id›) — ‹qty› left"),
a quantity per unit made,
its cost, and its stock margin.
"Add material line" adds a row with the picker ready;
lines delete without ceremony.
The same material twice on one piece is refused.

## Scenarios — completing a piece

Done and Failed both mean *made* — and making consumes.
The need is each line's quantity × the piece's units.

- No material lines →
  "Add at least one material line
  before marking this piece done or failed."
- No units →
  "Set a positive units count on this piece
  before marking it done or failed."
- Otherwise → **"Complete piece"** asks:
  "Update this piece status?
  You can choose whether to decrement inventory." —
  with "Decrement from inventory" ticked by default.
- Stock cannot cover the need →
  the dialog lists each shortage ("‹id›: need ‹n›, have ‹m›")
  and completing is still allowed with the decrement unticked.
- A completed piece back to Pending → **"Revert piece status"**:
  "Move this piece back to pending?
  You can choose whether to restore inventory quantities." —
  "Restore inventory quantities" ticked by default.
