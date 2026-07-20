# ADR-0004: Organize the frontend along Symfony conventions

- Status: Accepted
- Date: 2026-07-16

## Context

The team developing and maintaining this project
have zero frontend experience, 
frontend frameworks usually are quite messy of on the folder structure.

As this project is meant to be a no backend/only JS.
The JS is the actual backend

## Decision

The folder structure mirrors Symfony's project shape in a React SPA:

- `src/Entity/` — real entity classes that own their row mapping (`fromRecord`/`toRecord`) and
  invariants (`isActive()`, `Job.isCompleted()`, `Piece.isPriced()`).
- `src/Repository/` — data access behind interfaces, with per-entity repositories aggregated by
  an `EntityManager` (Doctrine-style), and two storage implementations (see ADR-0002):
  `LocalCsv/` (File System Access API) and `GSheet/` (Google Sheets v4 + Drive v3).
- `src/Service/` — constructor-injected domain services; pure pricing/search modules.
- `src/Controller/` — one component per route; `src/Component/` for shared UI.
- `translations/` at the repository root, Symfony-style, holding the `en`/`es` catalogs.
- `tests/Unit/` mirroring `src/`.

## Consequences

- Backend developers navigate the codebase by familiar convention.
- The repository interfaces make backend parity testable: both implementations satisfy the same
  contract, and everything above them is backend-agnostic.
