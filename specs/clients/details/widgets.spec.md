# A client's widgets

[The widgets](../../shared/widgets.spec.md) of a client's page —
their money story in five figures.
Money follows [pricing](../../shared/pricing.spec.md).
Two per row on a narrow screen, all five across on a wide one.

In order:

| Widget | Kind | Shows |
|---|---|---|
| Paid (ledger) | Money | Income actually recorded for this client, summed |
| Outstanding (jobs) | Money | Derived totals of their not-yet-paid, not-cancelled jobs |
| Jobs | Number | How many jobs they have, in any state |
| Avg job price | Money | The mean derived total of their priceable, non-cancelled jobs; "—" when none |
| Materials (estimate) | Money | What their completed pieces consumed, at average purchase prices |

The ledger counts what happened;
outstanding counts what should —
the difference is the client's open value.
Jobs whose pricing is incomplete simply
do not contribute to the money figures.
