# Dashboard

The home page: the shop at a glance, and the two most common actions
one press away.

It waits for the shop's data before showing anything
(a spinner until then — see [saving](../saving.spec.md)
for how data arrives), then offers, top to bottom:

- Two actions: **Record purchase**
  (the purchase flow — a future `transactions/purchase.spec.md`
  describes it) and **Add job**
  (the same creation dialog the jobs page uses —
  a future `jobs/` spec describes it).
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
