# A client's metrics

Five figures across the top of the page.
Money follows
[the derived-pricing law](../../decisions/ADR-0015-derived-pricing-and-income-on-paid.md).

| Metric | Means |
|---|---|
| Paid (ledger) | Income actually recorded for this client, summed |
| Outstanding (jobs) | Derived totals of their not-yet-paid, not-cancelled jobs |
| Jobs | How many jobs they have, whatever the status — archived and deleted ones not counted |
| Avg job price | The mean derived total of their priceable, non-cancelled jobs |
| Materials (estimate) | What their completed pieces consumed, at average purchase prices — a piece with no units counting as one |

The ledger counts what happened;
outstanding counts what should —
the difference between them is the client's open value.
Jobs whose pricing is incomplete simply
do not contribute to the money figures.
