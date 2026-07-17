# ADR-0015: Job money is derived from pieces; paying a job records the income

- Status: Accepted
- Date: 2026-07-18

## Context

A job is priced by what it produces.
Since v2 the product has derived every job total
from its pieces rather than storing a price on the job,
and generated the income transaction at the moment
a job is marked paid.
These rules shape four pages and the money reports,
but were never recorded as a decision.

## Decision

- **A job's total is derived, never stored**:
  the sum of units × per-unit price over its pieces.
  Deleted pieces are out; archived pieces still count —
  archiving tidies, it does not reprice history (ADR-0014).
- **A total either knows itself or says so**:
  if any counting piece lacks a price or units,
  every surface shows an explicit *incomplete* marker,
  never a partial number.
- **Paid is gated on completeness**:
  a job cannot become paid (or cancelled)
  while its total is incomplete.
- **Marking paid offers to record the income**,
  on by default:
  one income transaction for the derived total,
  linked to the job and its client.
  Leaving paid warns that income may already have been recorded —
  the app never deletes a transaction on its own.
- **The suggested per-unit price is material cost × 3**,
  a deliberate one-number heuristic the user can ignore.

## Consequences

- Pricing cannot drift from production reality —
  change the pieces and every total follows.
- The *incomplete* marker propagates honesty:
  dashboards and lists refuse to guess.
- Re-marking a job paid can create a second income transaction —
  the warning, not the app, is the guard (deliberate).
- The ×3 heuristic is visible product behaviour;
  changing it is a product decision, not a tweak.
