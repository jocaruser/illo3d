# ADR-0006: Job-based kanban with piece progress (hybrid), not piece-based

- Status: Accepted
- Date: 2026-07-16

## Context

The abandoned `feat/v2-data-model` branch replaced the job kanban with a piece-based board
driven by shop-defined columns, removing `jobs.status` in favour of a `completed` date. Its
own retrospective (`KANBAN_FEATURE_ANALYSIS.md` on that branch) catalogued the regressions:
cards lost pricing, client context and click-through; accessibility and reordering broke. It
recommended returning to job cards, enriched with piece information.

## Decision

v3 keeps the job-based kanban (five status columns: draft, in progress, delivered, paid,
cancelled) and adopts the retrospective's hybrid: each job card additionally shows piece
progress ("3/5 pieces done"), pricing total or the incomplete badge, benefit, and a due-date
band. `jobs.status` and `jobs.board_order` remain in the schema. The due-date intent of the
abandoned branch survives as the new `jobs.due_date` column powering a calendar view
alongside the kanban (a dashboard view switcher).

## Consequences

- No UX regression relative to v2; the piece-progress signal lands without losing job context.
- Shop-configurable kanban columns are rejected for now — statuses stay a fixed enum, keeping
  pricing/paid gating rules simple. Revisit only with concrete demand.
- The calendar view exists because `due_date` exists; both trace to the v2 branch's intent
  without adopting its data-model upheaval.
