# A material's purchase lots

Every batch this material was bought in, newest first:
its date, quantity, cost,
and a link to
[the purchase that created it](../../transactions/expense-details.spec.md),
named by the purchase's description —
or by its id, when no description resolves.

Quantity and cost edit in place, per lot —
corrections, not bookkeeping:
changing a lot rewrites neither the stock level
nor the purchase transaction.
A quantity must be positive; a cost can be zero, never negative.

The lots are what "average unit cost" means everywhere:
all active lots' costs divided by their quantities.

Before any purchase: "No purchase lots yet."
