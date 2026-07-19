# A job's pieces

A section of [a job's page](details.spec.md):
the making, piece by piece,
rendered as [tables render](../../shared/table.spec.md).
"Add piece" asks a name and, optionally, a per-unit price;
new pieces start Pending.
A piece missing its units count is highlighted yellow —
it blocks the job's total
([pricing](../../shared/pricing.spec.md))
and cannot be completed.
The quiet empty row: "No pieces yet."

Each row expands to its material lines, and edits in place:

| Column | Viewport | Notes |
|---|---|---|
| Expand | Always | The chevron opening the piece's material lines |
| ID | Always | |
| Name | Always | Emptying it is refused |
| Units | Always | A whole number, at least one |
| Price / unit | Always | Zero allowed (a gift); beside it, the suggestion — see below |
| Line total | Medium+ | units × price, when both are set |
| Est. benefit | Medium+ | The line's revenue minus its material cost |
| Status | Always | Pending / Done / Failed, [the dropdown](../../shared/dropdown.spec.md) — see the scenarios |
| Created | Wide+ | |

**The suggested price** — "Use ‹price› / unit" —
is the piece's material cost times three,
a starting point, not a rule
([pricing](../../shared/pricing.spec.md)).
It appears only when every material's cost is known.

## Material lines

The expanded piece shows its own small table,
rendered as [tables render](../../shared/table.spec.md):

| Column | Viewport | Notes |
|---|---|---|
| Line ID | Always | |
| Inventory | Always | The material, picked below |
| Quantity | Always | Per unit made |
| Material cost | Always | The line's cost at average purchase price |
| Stock / redo | Always | The line's margin — green ≥ 2 redos, yellow 1, red 0 |

The quiet empty row: "No material lines yet."
Each line picks its material with
[the dropdown](../../shared/dropdown.spec.md)
from live stock ("‹name› (‹id›) — ‹qty› left"),
and a quantity per unit made.
"Add material line" adds a row with the picker ready;
lines delete without ceremony.
The same material twice on one piece is refused.
Above the lines, the run's overall stock margin,
on the same scale as the Stock / redo column.

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
