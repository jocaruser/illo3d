# A job's pieces

The making, piece by piece.
"Add piece" asks a name and, optionally, a per-unit price;
new pieces start Pending.
A piece missing its units count is highlighted amber —
it blocks the job's total
([ADR-0015](../../decisions/ADR-0015-derived-pricing-and-income-on-paid.md))
and cannot be completed.

Each row edits in place:

| Column | Notes |
|---|---|
| ID | |
| Name | Emptying it is refused |
| Units | A whole number, at least one |
| Price / unit | Zero allowed (a gift); beside it, the suggestion — see below |
| Line total | units × price, when both are set |
| Est. benefit | The line's revenue minus its material cost |
| Status | Pending / Done / Failed — see the scenarios |
| Created | |

**The suggested price** — "Use ‹price› / unit" —
is the piece's material cost times three,
a starting point, not a rule
([ADR-0015](../../decisions/ADR-0015-derived-pricing-and-income-on-paid.md)).
While any material's cost is unknown the button stays,
disabled, reading "No suggested price available".

## Material lines

A piece expands to its materials,
led by the run's stock margin — a "Run stock" line:
how many times the whole run could be re-made from current stock,
green from two redos, amber at one, red at none.
Each line names a material
(picked from live stock — "‹name› (‹id›) — ‹qty› left",
the quantity in grams, "‹qty›g left", for filament),
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
  the dialog lists each shortage by material name
  ("‹name›: need ‹n›, have ‹m›")
  and completing is still allowed with the decrement unticked.
- Done to Failed, or back → both mean made,
  so the switch commits silently — no dialog, no stock movement.
- A completed piece back to Pending → **"Revert piece status"**:
  "Move this piece back to pending?
  You can choose whether to restore inventory quantities." —
  "Restore inventory quantities" ticked by default.
