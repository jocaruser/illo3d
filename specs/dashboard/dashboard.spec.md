# Dashboard

A page at `#/` — the home:
the shop at a glance, the two most common actions one press away.
It waits for the shop's data behind a spinner,
and shows no breadcrumbs — this is the root
([navigation](../navigation.spec.md)).

Top to bottom:

- **Record purchase**
  ([the purchase flow](../transactions/purchase.spec.md))
  and **Add job**
  ([the jobs list's dialog](../jobs/list.spec.md)).
- [The numbers](stats.spec.md).
- **The board or the calendar** — one at a time:
  a Kanban / Calendar switcher that starts on the board
  and remembers the choice across refreshes.
- Side by side — stacked on a narrow screen:
  [stock alerts](stock-alerts.spec.md)
  and [recent transactions](recent-transactions.spec.md).
