# Shared pricing behaviour

This file owns **cross-cutting monetary rules** for illo3d:
how inventory average cost is derived,
when a job or piece counts as priced,
and how revenue, material cost, margin, and dashboard aggregates relate.

Page specs keep layout, labels, and table columns;
they link here instead of restating formulas.

Future page specs should link with relative paths, for example:

- Job detail (widgets, pieces table, materials summary):
  `[pricing rules](../shared/pricing.spec.md)`
- Client detail metrics:
  `[pricing rules](../shared/pricing.spec.md)`
- Dashboard expected-benefit card:
  `[pricing rules](../shared/pricing.spec.md)`

## Average unit cost

An **inventory item** may have several **lots**.
Each lot has a quantity, a purchase amount, and an active flag.

The **average unit cost** for that item is the weighted mean over every lot that
counts toward the average:

- the lot is active (not archived or deleted);
- quantity is a positive number;
- purchase amount is known (zero is allowed and lowers the average).

The average is total purchase amount divided by total quantity across those lots.

Scenarios:

- No lot qualifies
  → average unit cost is **unknown** (not zero).
- One or more lots qualify
  → the shop uses that single weighted average everywhere this spec refers to
    “average unit cost” for the item.

## Counting pieces

A **piece** belongs to a job.
For **job pricing**, a **counting piece** is every piece on the job that is not
soft-deleted.
Archived pieces still count.
Removed (deleted) pieces are ignored entirely.

Piece **status** (pending, done, failed) does not change whether the piece counts
toward job pricing totals.

## Piece revenue

A piece has a per-unit **price** and a **units** count (a positive integer).

A piece is **priced** when both are set.
A price of zero is valid.

**Line revenue** for the piece is unit price × units when the piece is priced.
When the piece is not priced, line revenue is unknown and the piece does not
contribute to job totals.

## Piece material cost

Each piece may have **material lines** linking inventory items and quantities.
Only **active** lines count (not deleted).

For **one unit** of the piece, material cost is the sum over active lines of:

`line quantity × average unit cost` for that inventory item.

When computing that sum for display on the piece row:

- lines whose inventory item cannot be resolved are skipped;
- lines without a quantity are skipped;
- lines whose average unit cost is unknown are skipped.

The piece row can therefore show a **partial** material figure when some lines
could not be costed, while other lines contributed.

**Material cost for the full run** multiplies the per-unit material subtotal by
the piece’s units (defaulting to one unit when units are not yet valid for
pricing).

## Job pricing completeness

Job pricing looks only at **counting pieces**.

The job has **complete pricing** when:

- there is at least one counting piece; and
- every counting piece is priced (valid price and units).

When pricing is incomplete, the job **total** is not shown as a currency amount.
The UI shows an incomplete-pricing indicator instead of implying zero revenue.

When pricing is complete, the **job total** is the sum of line revenue over all
counting pieces.

## Job-level material cost and benefit

**Job material cost** (for example on the job detail widgets) aggregates material
need across counting pieces:

for each active material line on each counting piece,
add `line quantity × piece units × average unit cost` when that average is known.

Lines or items that cannot be costed are skipped;
the widget still shows a **numeric total** for whatever could be summed,
rather than treating the whole job as unknown.

**Job benefit** (margin) is job total minus that aggregated material cost,
but only when pricing is complete.
When pricing is incomplete, benefit is withheld (the same incomplete signal as the
total, not a misleading €0.00 margin).

## Piece-level benefit

On the pieces table, **piece benefit** is line revenue minus material cost for
the full run when line revenue exists.

It can appear even when job pricing is still incomplete, as long as that piece
has a line total.

Negative benefit is shown as a loss; positive as a gain.

## Suggested price

The shop can suggest a **per-unit selling price** from material cost alone.

For one unit of a piece, take the **material subtotal** (same basis as piece
material cost, but **every** active line must be costable).

When any line blocks costing (missing inventory, missing quantity, or unknown
average cost), the suggestion **fails** and the UI names which inventory items
blocked it.

When costing succeeds:

- **Suggested price** = material subtotal for one unit **× 3**.
- With no material lines, subtotal and suggested price are zero.

The hint does not replace operator-set prices; it is a derived suggestion only.

## Expected benefit

The **dashboard expected benefit** card sums margin across **open** jobs only:
status draft or in progress, and the job itself active (not archived or deleted).

For each counting piece on those jobs:

- the piece must be priced;
- it must have at least one active material line;
- every active line must be fully costable (same rules as suggested price).

For each qualifying piece, contribution is:

`units × unit price − units × per-unit material subtotal`.

Pieces that fail any rule are skipped (not counted as zero).
Archived counting pieces on open jobs **do** qualify when they meet the rules.

## Client materials estimate

On **client detail**, the **materials estimate** sums material value on
**consumed** pieces for that client’s jobs:
pieces marked done or failed, not deleted.

For each active material line on such a piece:

`line quantity × piece units × average unit cost`,
skipping lines when average cost is unknown.

Pending pieces and deleted lines do not contribute.
The estimate uses the same average-cost rule as elsewhere; it is not a duplicate
of the job materials summary table (that table keeps roll-ups and redo risk on
the job page).

## Unknown versus zero

| Situation | What the user should read |
|-----------|---------------------------|
| No qualifying lots for an inventory item | Average cost unknown; costing skips or errors as above |
| Job pricing incomplete | No job total or job benefit amount; incomplete indicator |
| Piece not priced | No line revenue; piece excluded from job total |
| Suggested price blocked | Error listing inventory items; no suggested figure |
| Expected benefit: piece fails qualification | Piece omitted from the sum (not €0.00 margin) |
| Free lot (zero purchase amount) | Lowers the weighted average; still a known cost |
| Priced piece with zero unit price | Valid; line revenue can be zero |

Currency formatting and exact dash versus badge wording stay on each page spec;
this file defines the underlying numbers and when a value is missing.
