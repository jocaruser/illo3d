# A material's purchase lots

A section of [a material's page](details.spec.md):
every batch this material was bought in, newest first,
rendered as [tables render](../../shared/table.spec.md).

| Column | Viewport | Notes |
|---|---|---|
| Transaction | Always | The purchase's description, opening [its page](../../transactions/expense-details.spec.md) — [linking](../../shared/linking.spec.md) |
| Date | Always | When the batch was bought |
| Qty | Always | The units it added |
| Amount | Always | What it cost |

Nothing here edits:
a lot is corrected on
[the purchase's own page](../../transactions/expense-details.spec.md),
never in this table.

The lots are what "average unit cost" means everywhere:
the lots' costs divided by their quantities.

Empty says "No purchase lots yet."
