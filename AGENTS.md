# Agent Guidelines for illo3d

## Framework

> Framework-managed section. Add project-specific instructions outside this section.

This project follows the Aircury engineering framework defined in [FRAMEWORK.md](./FRAMEWORK.md).

All agents contributing to this repository MUST read and apply FRAMEWORK.md before doing any work. It is not optional and it is not advisory.

All framework workflow rules, delivery constraints, and enabled standards now live in `FRAMEWORK.md` as the single source of truth.

If this repository also has project-specific agent instructions, keep them outside the framework-managed section or in `FRAMEWORK.local.md`, and treat `FRAMEWORK.md` as the governing framework layer.

Where the repository rules in this file are stricter than `FRAMEWORK.md`, the repository rules win — in particular the Golden Rules below: all commands go through Make (never run `pnpm`, `vitest`, `playwright`, or `tsc` directly), `make quality-gate` before finishing, the `APP_VERSION` bump in every PR, and the changelog requirement.

## Golden Rules

### 1. All Commands Go Through Make
- **Never** run `pnpm`, `npm`, `vitest`, `playwright`, `docker compose exec`, or `tsc` directly.
- Always use the Makefile targets: `make dev`, `make build`, `make test`, `make e2e-test`, `make lint`, `make quality-gate`, `make add PKG=...`, etc.
- The Makefile ensures the right environment (Docker containers, env vars, Vite server orchestration for E2E).

### 2. All Tests Must Pass — No Skipping, No Removing
- **A failing test is never skipped or deleted.** It is a bug report. Fix the root cause.
- Do **not** use `test.skip()`, `describe.skip()`, `test.fixme()`, or comment out tests to "get CI green."
- Do **not** delete tests because they are "flaky" or "hard to maintain." Flakiness is fixed by stabilizing the test or the code under test.
- If a test asserts behavior that no longer matches the app, decide which is correct:
  - If the test is right, fix the app.
  - If the app behavior intentionally changed, update the test assertion to match the new contract.
- After any code change, run `make quality-gate` (build + lint + unit tests). All must be green.
- When touching routing, auth, purchases, jobs, or any Playwright-covered flow, run `make e2e-test` locally and confirm **zero failures, zero skips**.

### 3. Quality Gate Before Finish
```
make quality-gate   # build, lint, unit tests, e2e tests — must all pass
```

### 4. TDD for Bug Fixes
When fixing a confirmed bug or regression, follow the TDD workflow:
1. Reproduce in a test (red).
2. Apply the minimal fix (green).
3. Run `make quality-gate` to verify.

### 5. Version Must Be Bumped in Every PR
- Every PR **must** increment `APP_VERSION` in `src/Config/version.ts`.
- Follow semver: bump major for breaking changes, minor for new features, patch for bug fixes.
- Do this **before** creating the PR commit so the version reflects the change being merged.

### 6. Use `gh` CLI for GitHub Operations
- Prefer `gh` CLI over GitHub MCP tools for PR, branch, and other GitHub operations.
- GitHub MCP tools may fail with authentication errors in this environment; `gh` uses local git credentials and works reliably.
- Use `gh pr create`, `gh repo`, `gh issue`, etc. as needed.

### 7. Document User-Facing Changes in the Changelog
- For every PR that changes user-facing behavior, add or update an entry in the changelog.
- Create or update `changelog/v<version>.md` for the version being released (matching `APP_VERSION` in `src/Config/version.ts`).
- The release workflow uses `changelog/v<version>.md` as the GitHub release body when present; otherwise it falls back to the auto-generated PR list.
- See `CHANGELOG.md` for the index of all releases.

## Project Structure

The frontend follows Symfony conventions — see `ARCHITECTURE.md` for the full rationale.

- `src/Config/` — `version.ts` (`APP_VERSION`), `schema.ts` (sheet names + headers), `routes.tsx`
- `src/Entity/` — real entity classes; each maps itself to/from sheet rows and owns its invariants
- `src/Repository/` — data access: backend contracts, `LocalCsv/` + `GSheet/` implementations,
  per-entity repositories, `EntityManager`
- `src/Service/` — domain services (constructor-injected), incl. `AuditLogger`, `Pricing/`, `Search/`
- `src/Migration/` — migration plans, steps, targets and orchestrator (the migration wizard engine)
- `src/Security/` — Google OAuth session handling
- `src/Store/` — Zustand stores; `src/Controller/` — one component per route
- `src/Component/`, `src/Theme/`, `src/Hook/`, `src/I18n/`
- `translations/` — `en.json` / `es.json` message catalogs (repo root, Symfony-style)
- `tests/Unit/` — Vitest unit tests mirroring `src/`; **coverage thresholds are 100%**
- `tests/e2e/` — Playwright E2E tests (Chromium only, `workers: 1`, serial where needed)
- `schema.dbml` — mirrors `src/Config/schema.ts`; update both in the same PR
- `Makefile` — Single source of truth for all dev/CI commands
- `.cursor/rules/quality-gate.mdc` — Detailed quality gate rules
- `playground/` — Interactive HTML playgrounds for design/copy exploration
- `.agents/skills/` — Custom skills (load with `skill` tool)

## Skills
- **html-reports** (`skill html-reports`): Load when user asks for HTML playgrounds, "alternatives in html", or "playable" comparisons. Creates self-contained interactive HTML files saved to `playground/`.
