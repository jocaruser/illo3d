---
name: tdd-bugfix
description: >-
  Red-green TDD workflow for bug fixes and regressions: failing test (or revert),
  then fix, then make quality-gate. Use when the user asks for TDD on a fix,
  a regression test, or "test first" for a bug; also apply during OpenSpec tasks
  that are explicitly bugfixes.
license: MIT
compatibility: This repo uses `make test` / `make quality-gate` (Makefile only).
---

# TDD workflow for bug fixes

Use this when fixing a **confirmed bug** or **regression** and the user wants tests to drive the change (or when a task in `tasks.md` is clearly a fix and tests are missing).

## Steps

1. **Reproduce in a test (red)**  
   - Prefer **one focused unit or integration test** that asserts the *correct* behavior (not the buggy behavior).  
   - If a fix already landed and you need to prove the gap: **temporarily revert** the production fix, add the test, run `make test` — it should **fail** for the right reason.  
   - If starting from scratch: add the test first; it should **fail** until the fix exists.

2. **Implement the minimal fix (green)**  
   - Restore or apply the production change.  
   - Keep scope tight: only what the failing test (and real bug) require.

3. **Verify**  
   - Run `make quality-gate` (build, lint, unit tests). All must pass per project rules.

4. **Document in OpenSpec (when applicable)**  
   - If work sits under `openspec/changes/<name>/`, mention the new/updated test in the relevant task or design note when it helps future readers — without expanding scope beyond what the user asked.

## Choosing test type

| Situation | Prefer |
|-----------|--------|
| Pure logic / store / service | Unit test next to module (`*.test.ts` / `*.test.tsx`) |
| Hook behavior | `renderHook` + mocks (`*.test.tsx`) |
| Cross-cutting ref or small pure helper | Dedicated `*.test.ts` for the helper |
| Full drag/drop or multi-surface UI | E2E only if unit tests cannot hold the contract; still add unit tests where they catch the bug |

## Makefile

Never run `pnpm test` or `vitest` directly unless the Makefile exposes no target — in this repo use **`make test`** and **`make quality-gate`**.

## Related

- **Quality gate**: `.cursor/rules/quality-gate.mdc` — validation after any change.  
- **OpenSpec implementation**: `.cursor/skills/openspec-apply-change/SKILL.md` — use this TDD flow for bugfix-style tasks when requested.
