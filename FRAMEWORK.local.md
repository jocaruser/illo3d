# FRAMEWORK.local.md

Project-specific instructions, additions, and overrides for this repository.

This file is intentionally local to the project. Aircury AI Framework installs it as a starter file but never overwrites it during updates.

Add repository-specific rules below.

## Specifications Location

Canonical behaviour specs live in the page-focused `specs/` tree
(ADR-0008; start at `specs/README.md`).
There is no `specs/features/` capability layout in this project:
where `FRAMEWORK.md` or capability docs speak of `specs/features/`,
the page-focused tree is the target.
`openspec/specs/` is the frozen v2 record — history, never updated.
ADRs live in `specs/ADRs/`:
where `FRAMEWORK.md` or capability docs say `specs/decisions/`,
that folder is the target.

Frontend capability overrides
(`docs/aircury/capabilities/frontend.md` is framework-maintained
and must not be edited directly; these local rules win):

- `specs/features/<name>/` contract files are not kept.
  Where the capability doc says to create or update them,
  treat layout/experience/implementation-plan artefacts
  as working documents
  and fold their outcomes into the relevant page spec.
- `specs/ui/frontend-workflow.md` does not exist;
  the self-contained `frontend-ui-workflow` skill
  and its bundled references replace it.
- `specs/ui/style-guide.md` stays canonical for visual tokens,
  at that exact path.
