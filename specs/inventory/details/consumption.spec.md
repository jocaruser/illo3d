# A material's consumption

A section of [a material's page](details.spec.md):
where the material goes —
one row per piece that uses it,
read straight from the pieces' material lines,
rendered as [tables render](../../shared/table.spec.md).

| Column | Viewport | Notes |
|---|---|---|
| Job | Always | The job making the piece, linked — [linking](../../shared/linking.spec.md) |
| Piece | Always | The piece's name |
| Qty | Always | The units of this material the piece takes |
| Cost | Always | That quantity at the material's average purchase price — the same figure as [the job's materials summary](../../jobs/details/materials-summary.spec.md) |

Empty says "No consumption recorded for this material yet."
