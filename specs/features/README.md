# Living Specifications

This project does not use the `specs/features/` capability layout.
Its canonical behaviour record is the page-focused tree
one level up — start at [`specs/README.md`](../README.md) —
per [ADR-0008](../decisions/ADR-0008-page-focused-behaviour-specs.md).
(`openspec/specs/` is the frozen v2 record, kept as history.)

Where framework workflows speak of updating `specs/features/`,
update the page-focused tree instead.

## Frontend Feature Contract

For new UI, high-fidelity rebuilds, non-trivial forms, role-gated UI,
or substantial frontend behaviour changes,
use `frontend-ui-workflow` to keep feature-level frontend contracts
beside the relevant page spec:

- `layout.md`: structural source of truth for fields, labels,
  sections, actions, and static content.
- `experience.md`: behavioural source of truth for flows,
  micro-interactions, validation, loading/error/empty states,
  and visibility rules.
- `implementation-plan.md`: clean implementation source of truth
  for component responsibilities, file organisation, state ownership,
  JSX structure, local primitive reuse,
  and conditional rendering strategy.

These files complement the behaviour specs. They do not replace them.

Visual tokens, reusable primitives, and composition patterns
live in `specs/ui/style-guide.md`.
