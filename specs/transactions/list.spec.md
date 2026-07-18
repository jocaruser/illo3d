# Transactions

The money ledger:
every movement, in and out, newest first,
with the running **Balance** above it
and "Record purchase" opening [the purchase flow](purchase.spec.md).

The ledger is **read-only by design** —
rows are created by things happening:
[a purchase](purchase.spec.md) records spending,
[paying a job](../jobs/details/widgets.spec.md#scenarios--changing-status)
records income
([ADR-0015](../decisions/ADR-0015-derived-pricing-and-income-on-paid.md)).
Only [a purchase's own page](expense-details.spec.md)
can amend anything, and only its own numbers.

The table behaves
[as all lists do](../shared/lists.spec.md).

| Column | Notes |
|---|---|
| ID | A purchase's id opens [its page](expense-details.spec.md); income ids are plain |
| Date | |
| Type | Income or Expense |
| Amount | Income positive and green; spending negative and red |
| Category | What kind of spending; income from jobs says "job" |
| Concept | Links to what explains it — the job for income, [the purchase's page](expense-details.spec.md) for spending with materials; plain otherwise |
| Client | Opens the client, when the movement has one |

Empty ledger:
"No transactions yet.
Recording a purchase or paying a job creates one."
