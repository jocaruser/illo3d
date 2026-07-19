# Dashboard — the numbers

A section of [the dashboard](dashboard.spec.md):
four figures, each a card; two are doors to the money pages.

| Card | Shows | Pressing it |
|---|---|---|
| Balance | Every transaction summed. Green at zero or above, red below. | Opens transactions |
| Active jobs | Jobs neither paid nor cancelled | — |
| Revenue this month | Income dated this calendar month, summed | Opens transactions |
| Pieces completed (7 days) | Pieces finished in the last seven days | — |

Deleted things count nowhere.
Archived jobs and pieces leave the work figures;
their money stays counted — archive never touches money
([lifecycle](../shared/lifecycle.spec.md)).

## Expected benefit

A wider card, "Expected benefit (active jobs)":
what the open work should earn once done.
For every job neither paid nor cancelled,
each fully described piece
(units and price set, materials listed, costs known)
contributes revenue minus material cost —
[pricing](../shared/pricing.spec.md)'s sanctioned estimate,
partial by design, counting only what is described.
When nothing qualifies, the card teaches instead of showing 0:
"Add units, per-unit prices, and material lines with lot costs
on draft or in-progress jobs to see expected benefit."
