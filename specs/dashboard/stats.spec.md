# Dashboard — the numbers

Four figures, each a card; two of them are doors to the money pages.

| Card | Shows | Pressing it |
|---|---|---|
| Balance | Every transaction summed — the shop's money position. Green positive, red negative, neutral at zero. | Opens transactions |
| Active jobs | How many jobs are draft or in progress | — |
| Revenue this month | Income dated this calendar month, summed | Opens transactions |
| Pieces completed (7 days) | Done pieces created in the last seven days — nothing records the moment a piece was finished, so its creation stands in | — |

Archived and deleted things count in none of them
(the benefit estimate below makes the one exception,
still counting archived pieces).

## Expected benefit

A wider card, "Expected benefit (active jobs)":
what the open work should earn once done —
for every draft or in-progress job,
each fully described piece
(units and price set, materials listed, material costs known)
contributes its revenue minus its material cost.

Pieces missing any of that simply do not count,
so the figure can be partial —
it is an *estimate* of what is described,
the [one sanctioned exception](../decisions/ADR-0015-derived-pricing-and-income-on-paid.md)
to the incomplete-marker rule.
When nothing qualifies, the card explains what to add instead of showing 0:
"Add units, per-unit prices, and material lines with lot costs
on draft or in-progress jobs to see expected benefit."
