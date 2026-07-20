# A job's widgets

[The widgets](../../shared/widgets.spec.md) of a job's page.
Money follows one law throughout
([pricing](../../shared/pricing.spec.md)):
**a job's total is the sum of units × per-unit price over its pieces** —
deleted pieces excluded, archived ones still counting —
and when any counting piece lacks a price or units,
every money figure shows **"Incomplete pricing"** instead of a number.

In order:

| Widget | Kind | Shows |
|---|---|---|
| ID | Text | The job's id and description — a double-width card carrying Edit and [the lifecycle actions](../../shared/lifecycle.spec.md) |
| Status | Choice | [The dropdown](../../shared/dropdown.spec.md) — the scenarios below |
| Total | Money | The derived total, or "Incomplete pricing" |
| Client | Text | The client's name, opening their page |
| Due date | Date | Editable in place; lateness-coloured — below |
| Benefit | Money | Total minus material cost, or "Incomplete pricing" |
| Filament | Number | "‹grams› g" the pieces will consume |
| Consumables | Number | "‹units› units" likewise |
| Risk factor | Number | The redo margin — below |
| Material cost | Money | The pieces' materials at average purchase prices |

## Due date

Colour measures days past due:
yellow from three, orange from five, red from seven.
A job with no due date measures from its creation date instead.
(The [board](../../dashboard/kanban.spec.md)
and [calendar](../../dashboard/calendar.spec.md) reuse this scale.)

## Risk factor

For each filament the job uses:
how many times the whole job could be re-printed from current stock —
its *redos*.
The widget shows the worst one:
"‹n› redos (‹material›)",
green from two, yellow at one, red at none.
A job using no filament says "No filament lines".

## Scenarios — changing status

Draft, in progress and delivered move freely between each other.
The edges are gated:

- Moving to **Paid** or **Cancelled** with pricing incomplete
  → refused:
  "Set a per-unit price and a units count on every piece
  for this job before moving it to Paid or Cancelled."
- Moving to **Paid** with pricing complete
  → "Mark job as paid":
  "Mark this job as paid for ‹total›?
  An income transaction will be created." —
  with "Create income transaction for this payment" ticked by default.
  Confirming with it ticked records the income
  against the job and its client; unticked records nothing.
- Moving to **Cancelled** → "Cancel job": "Mark this job as cancelled?"
- Leaving **Paid** → "Change status from paid?":
  "This job is paid and already has an income transaction.
  Changing it to "‹status›" means if you mark it paid again,
  another income transaction will be added. Continue?" —
  the app warns, and never deletes a transaction on its own.
