# Agent Guidelines for illo3d

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

### 5. No OpenSpec Changes in Git
- The `openspec/changes/` directory is `.gitignore`d.
- Do not `git add` OpenSpec change folders unless the user explicitly requests it.

### 6. Version Must Be Bumped in Every PR
- Every PR **must** increment `APP_VERSION` in `src/config/version.ts`.
- Follow semver: bump major for breaking changes, minor for new features, patch for bug fixes.
- Do this **before** creating the PR commit so the version reflects the change being merged.

### 7. Use `gh` CLI for GitHub Operations
- Prefer `gh` CLI over GitHub MCP tools for PR, branch, and other GitHub operations.
- GitHub MCP tools may fail with authentication errors in this environment; `gh` uses local git credentials and works reliably.
- Use `gh pr create`, `gh repo`, `gh issue`, etc. as needed.

### 8. Document User-Facing Changes in the Changelog
- For every PR that changes user-facing behavior, add or update an entry in the changelog.
- Create or update `changelog/v<version>.md` for the version being released (matching `APP_VERSION` in `src/config/version.ts`).
- The release workflow uses `changelog/v<version>.md` as the GitHub release body when present; otherwise it falls back to the auto-generated PR list.
- See `CHANGELOG.md` for the index of all releases.

## Project Structure
- `src/` — React + TypeScript frontend
- `tests/e2e/` — Playwright E2E tests (Chromium only, `workers: 1`, serial where needed)
- `Makefile` — Single source of truth for all dev/CI commands
- `.cursor/rules/quality-gate.mdc` — Detailed quality gate rules
