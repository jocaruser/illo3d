# Transactions

The listing page for the money ledger, newest first.
It lives at `#/transactions`
and follows [the list page](../shared/list.spec.md);
its title is "Transactions",
its Add button **"Record purchase"** —
[the purchase flow](create.spec.md).

The ledger is **read-only by design** —
rows are created by things happening:
[a purchase](create.spec.md) records spending,
[paying a job](../jobs/details/widgets.spec.md#scenarios--changing-status)
records income ([pricing](../shared/pricing.spec.md)).
Only [a purchase's own page](expense-details.spec.md)
can amend anything, and only its own numbers.

| Column | Viewport | Notes |
|---|---|---|
| ID | Always | A purchase's id opens [its page](expense-details.spec.md); income ids are plain |
| Date | Always | |
| Type | Small+ | Income or Expense |
| Amount | Always | Income positive and green; spending negative and red |
| Category | Medium+ | What kind of spending; income from jobs says "job" |
| Concept | Wide+ | Linked as [linking](../shared/linking.spec.md) says |
| Client | Medium+ | Opens the client, when the movement has one |

Where it departs from the default:

- **No Actions column** — nothing here edits.
- Beside the Add button, the running **Balance** —
  every row summed, green or red by sign.

The quiet empty row:
"No transactions yet.
Recording a purchase or paying a job creates one."
