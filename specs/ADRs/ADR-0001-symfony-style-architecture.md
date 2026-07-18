# ADR-0001: Organize the frontend along Symfony conventions

- Status: Accepted
- Date: 2026-07-16

## Context

The v2 codebase organized code by technical kind (`services/`, `stores/`, `pages/`, `lib/`)
with per-feature service functions operating on raw sheet matrices. Data access, domain rules
and UI concerns were spread across files with no enforced seams, and the primary maintainer is
a backend developer at home in Symfony projects.

## Decision

The v3 rewrite mirrors Symfony's project shape in a React SPA:

- `src/Entity/` — real entity classes that own their row mapping (`fromRecord`/`toRecord`) and
  invariants (`isActive()`, `Job.isCompleted()`, `Piece.isPriced()`).
- `src/Repository/` — data access behind interfaces, with per-entity repositories aggregated by
  an `EntityManager` (Doctrine-style), and exactly two storage implementations: `LocalCsv/`
  (File System Access API) and `GSheet/` (Google Sheets v4 + Drive v3).
- `src/Service/` — constructor-injected domain services; pure pricing/search modules.
- `src/Controller/` — one component per route; `src/Component/` for shared UI.
- `translations/` at the repository root, Symfony-style, holding the `en`/`es` catalogs.
- `tests/Unit/` mirroring `src/`.

## Consequences

- Backend developers navigate the codebase by familiar convention.
- The repository interfaces make backend parity testable: both implementations satisfy the same
  contract, and everything above them is backend-agnostic.
- Entities are the single place where sheet-shape knowledge lives; matrix plumbing is confined
  to `src/Repository/Matrix.ts`.
- The layout deviates from idiomatic React community structure; contributors coming from React
  projects need the map in `ARCHITECTURE.md`.
