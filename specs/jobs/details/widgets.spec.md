# A job's widgets

The top of the page is a grid of small cards.
Money follows one law throughout
([ADR-0015](../../decisions/ADR-0015-derived-pricing-and-income-on-paid.md)):
**a job's total is the sum of units × per-unit price over its pieces** —
deleted pieces excluded, archived ones still counting.
When any counting piece lacks a price or units —
or the job has no pieces at all —
the price-derived figures, Total and Benefit,
show **"Incomplete pricing"** instead of a number.
The quantity-derived figures —
Filament, Consumables, Material cost — always show,
counting a piece with no units as a single unit.

| Widget | Shows |
|---|---|
| ID | The job's id and description, with the page's Edit / Archive actions |
| Status | The current status, editable — see the scenarios below |
| Total | The derived total, or "Incomplete pricing" |
| Client | The client's name, opening their page |
| Due date | Lateness, colour-coded — see below |
| Benefit | Total minus material cost, or "Incomplete pricing" |
| Filament | Grams of filament the pieces will consume |
| Consumables | Units of consumables likewise |
| Risk factor | The redo margin — see below |
| Material cost | What the pieces' materials cost, at average purchase prices |

## Due date

Editable in place.
Colour measures days past due:
amber from three, orange from five, red from seven.
A job with no due date measures from its creation date instead.
(The [board](../../dashboard/kanban.spec.md)
and [calendar](../../dashboard/calendar.spec.md) reuse this scale.)

## Risk factor

For each filament the job uses:
how many times the whole job could be re-printed from current stock —
its *redos*.
The widget shows the worst one:
"‹n› redos (‹material›)",
green from two, amber at one, red at none.
A job using no filament says "No filament lines".

## Scenarios — changing status

Draft, in progress and delivered move freely between each other.
The edges are gated:

- Moving to **Paid** or **Cancelled** with pricing incomplete
  (a job with no pieces always is)
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
- Leaving **Paid** — to Cancelled included,
  which asks only this graver question
  → "Change status from paid?":
  "This job is paid and already has an income transaction.
  Changing it to "‹status›" means if you mark it paid again,
  another income transaction will be added. Continue?" —
  the app warns, and never deletes a transaction on its own.
