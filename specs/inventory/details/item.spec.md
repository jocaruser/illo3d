# A material's page

A material's identity — id, type, average unit cost, created date —
and its three editable facts:

- **Current stock** — a number, zero or more,
  two decimals at most.
  Purchases and [completed pieces](../../jobs/details/pieces-table.spec.md)
  move it automatically; this edit is for corrections.
- **Warning thresholds** — three levels: amber, orange, red.
  Stock at or below a level tints it —
  [in the list](../list.spec.md)
  and on [the dashboard's alerts](../../dashboard/stock-alerts.spec.md) —
  the severest crossed level winning.
  A level at zero is off.
- **Swatch colour** — optional, for telling filaments apart at a glance:
  a colour picker, a hex field, and a clear.

Below: [the purchase lots](lots.spec.md)
and [the consumption](consumption.spec.md).
When both are empty, one line covers them:
"No purchase lots or consumption recorded for this material yet."

**Archive** asks with the consequence and the way back both named:
"Archive "‹name›" and all its purchase lots?
You can un-archive it later." —
the cascade of
[ADR-0014](../../decisions/ADR-0014-archive-then-delete-lifecycle.md).
Breadcrumbs behave as [navigation](../../navigation.spec.md) says;
lifecycle as [every details page does](../../shared/lifecycle.spec.md).
