# A job's materials summary

A section of [a job's page](details.spec.md):
one row per material the job's pieces use, aggregated,
rendered as [tables render](../../shared/table.spec.md).

| Column | Viewport | Notes |
|---|---|---|
| Inventory | Always | The material, opening its page |
| Quantity | Always | Everything the job needs of it, across all pieces and units |
| Est. cost | Always | That quantity at the material's average purchase price |
| Redos | Always | For filament: times the job could be re-printed from stock; others dash |
| Remaining | Always | Current stock |
| Used in | Always | The pieces that use it |

Filament first, then consumables, then equipment.
The quiet empty row: "No materials used for this job."

Below the table, **"Overall risk"**:
the worst filament's redos, named —
the same figure as [the risk widget](widgets.spec.md).
