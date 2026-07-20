# ADR-0010: Last save wins — no multi-writer conflict detection

- Status: Accepted
- Date: 2026-07-18

## Context

A shop can be open in two browser tabs at once,
or (on Google Drive) on two devices.
Each open copy edits its own in-memory snapshot
and saving writes the whole workbook (ADR-0003).
Nothing compares what is being written
with what someone else may have saved in between.

illo3d shops are personal:
one person runs their shop,
and simultaneous editing is an accident, not a workflow.
Detecting or merging conflicts would carry real complexity
(version stamps per save, a comparison on write,
a resolution experience)
for a situation the product does not aim to support.

## Decision

The product accepts the limitation and states it plainly:
**the last save wins, silently**.
Whatever was saved earlier by another tab or device
is overwritten wholesale, without warning.

`specs/saving/saving.spec.md` records this as observable behaviour
so nobody mistakes it for an oversight.

## Consequences

- Saving stays simple and whole-workbook,
  consistent with the snapshot model.
- A user who edits in two places can silently lose
  the earlier tab's saved work —
  accepted for a single-person product.
- Any future conflict story
  (a warning on stale save, a merge, per-sheet stamps)
  supersedes this ADR and rewrites the saving spec.
