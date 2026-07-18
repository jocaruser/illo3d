# A material's page

A page at `#/inventory/{id}`,
with [everything a details page has](../../shared/details.spec.md)
and two sections below:
[the purchase lots](lots.spec.md)
and [the consumption](consumption.spec.md).

Its widgets, [as widgets behave](../../shared/widgets.spec.md),
in this order:

| Widget | Kind | Shows |
|---|---|---|
| ID | Text | The material's id, name and type, with the page's Archive action |
| Avg unit cost | Money | What a unit has cost on average, from its purchases |
| Created | Date | When the material was created |
| Current stock | Number | Editable in place — below |
| Warning thresholds | Number | Three levels, editable in place — below |
| Swatch colour | Choice | A colour, editable in place — below |

The three that edit in place:

- **Current stock** — a number, zero or more,
  two decimals at most.
  Purchases and [completed pieces](../../jobs/details/pieces-table.spec.md)
  move it automatically; this edit is for corrections.
- **Warning thresholds** — three levels: yellow, orange, red.
  Stock at or below a level tints it —
  [in the list](../list.spec.md)
  and on [the dashboard's alerts](../../dashboard/stock-alerts.spec.md) —
  the severest crossed level winning.
  A level left empty is off;
  zero is a real level, meaning exactly none left.
- **Swatch colour** — optional,
  for telling filaments apart at a glance:
  a colour picker, a hex field, and a clear.

**Archive** asks with the consequence and the way back both named:
"Archive "‹name›" and all its purchase lots?
You can un-archive it later." —
the cascade of
[ADR-0014](../../decisions/ADR-0014-archive-then-delete-lifecycle.md).
