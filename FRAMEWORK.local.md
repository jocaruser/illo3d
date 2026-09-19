# FRAMEWORK.local.md

Project-specific instructions, additions, and overrides for this repository.

This file is intentionally local to the project. Aircury AI Framework installs it as a starter file but never overwrites it during updates.

Add repository-specific rules below.

## Specifications Location

Canonical behaviour specs currently live in `openspec/specs/` (OpenSpec layout); migration to `specs/features/` is planned. New ADRs go to `specs/decisions/`.

## ADR status records a decision, not delivery

An ADR's `Status: Accepted` means the decision is finalised and immutable
(per `docs/aircury/capabilities/decision-records.md`) — it does not mean
the code implements it yet.
Before citing an ADR as evidence that current behaviour already matches a
decision, verify the claim against the code the ADR governs, not against
the status field alone.
(First caught on card uF83L6kAGHLY: spec evidence for a PR's disposition
cited `ADR-0012-in-memory-migration-with-explicit-submit` — Accepted — as
proof a migration behaviour had shipped, while `src/Migration/orchestrator.ts`
still implemented the pre-ADR design.)
