# A material's consumption

A section of [a material's page](details.spec.md):
where the material goes —
one row per piece that uses it,
read straight from the pieces' material lines,
rendered as [tables render](../../shared/table.spec.md).

| Column | Notes |
|---|---|
| Job | The job making the piece, linked — [linking](../../shared/linking.spec.md) |
| Piece | The piece's name |
| Qty | The units of this material the piece takes |
| Cost | That quantity at the material's average purchase price — the same figure as [the job's materials summary](../../jobs/details/materials-summary.spec.md) |

Every column stays at every width.

Empty says "No consumption recorded for this material yet."
