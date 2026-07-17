# Dashboard

The home page: the shop at a glance, and the two most common actions
one press away.

It waits for the shop's data before showing anything —
a spinner until then — and offers, top to bottom:

- Two actions: **Record purchase**
  ([the purchase flow](../transactions/purchase.spec.md))
  and **Add job**
  ([the same creation dialog as the jobs list](../jobs/list.spec.md)).
- [The numbers](stats.spec.md) —
  four figures and the expected benefit.
- **The jobs board or the calendar** —
  one at a time, chosen by a "Dashboard view" switcher
  (Kanban / Calendar) that starts on the board:
  [kanban](kanban.spec.md), [calendar](calendar.spec.md).
- Side by side at the bottom:
  [stock alerts](stock-alerts.spec.md)
  and [recent transactions](recent-transactions.spec.md).

Breadcrumbs behave as [navigation](../navigation.spec.md) says.
