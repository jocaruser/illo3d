# Pricing

How every money figure is derived; no total is ever stored.

- **A job's total** is the sum of units × per-unit price
  over its pieces —
  deleted pieces are gone
  ([ADR-0014](../ADRs/ADR-0014-archive-then-delete-lifecycle.md)),
  archived ones still count.
- **A total either knows itself or says so**:
  while any counting piece lacks units or a price,
  every surface shows **"Incomplete pricing"**,
  never a partial number.
  The one exception is
  [the dashboard's expected benefit](../dashboard/stats.spec.md):
  an estimate over fully described pieces only, named as such.
- **Material cost** is quantity × the material's
  average purchase price —
  [the lots](../inventory/details/lots.spec.md) define the average.
- **Benefit** is total minus material cost.
- **Paid is gated**: a job cannot become paid or cancelled
  while its pricing is incomplete.
- **Marking paid offers to record the income**, ticked by default:
  one income transaction for the derived total,
  against the job and its client.
  Leaving paid warns that marking again would add a second one —
  the app never deletes a transaction on its own.
- **The suggested per-unit price** is material cost × 3 —
  a starting point, not a rule.

The dialogs and gates these rules surface through are
[the job's widgets'](../jobs/details/widgets.spec.md).
