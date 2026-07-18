# A job's materials summary

One row per material the job's pieces use, aggregated:

| Column | Notes |
|---|---|
| Inventory | The material, opening its page |
| Quantity | Everything the job needs of it, across all pieces and units |
| Est. cost | That quantity at the material's average purchase price |
| Redos | For filament: how many times the job could be re-printed from stock; others show a dash |
| Remaining | Current stock |
| Used in | The pieces that use it |

Filament first, then consumables, then equipment.

Below the table, **"Overall risk"**:
the worst filament's redos, named —
the same figure as [the risk widget](widgets.spec.md).

A job using no materials says
"No materials used for this job."
