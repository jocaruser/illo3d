## Why

The project currently has a broken build pipeline: `make build` fails with 13 TypeScript errors, `make lint` reports 5 ESLint errors, and `make test` has 2 failing tests out of 24. This blocks production builds and erodes confidence in code quality. Additionally, there are no guardrails to prevent regressions — no pre-commit hooks, no CI checks, and no enforced convention for using Makefile commands instead of raw pnpm/docker.

## What Changes

- Fix all 13 TypeScript build errors (misplaced tsconfig types, missing `@types/node`, vitest/vite version mismatch, generic constraint issues)
- Fix all 5 ESLint lint errors (unused imports, useless try/catch)
- Fix 2 failing tests (`App.test.tsx` and `AuthStatus.test.tsx` broken after login page changes)
- Update vitest from v2 to v3 to resolve vite 6 compatibility
- Add `@types/node` for vite/vitest config files
- Add a Cursor rule enforcing: zero-error build, flawless lint, passing tests, and exclusive use of Makefile commands

## Non-goals

- Adding CI/CD pipelines or GitHub Actions (future change)
- Adding pre-commit hooks (husky/lint-staged) — may be a follow-up
- Refactoring or restructuring existing code beyond what is needed to fix errors
- Adding new ESLint rules or stricter lint configuration beyond fixing current errors

## Capabilities

### New Capabilities
- `build-quality-gate`: Cursor rule enforcing that build, lint, and tests must pass with zero errors, and that all pnpm/docker interactions use Makefile commands

### Modified Capabilities
- `docker-dev-env`: The spec states `make build` produces static files and `make lint` reports issues — currently both fail. Fixing errors ensures the spec is satisfied. No requirement changes needed, just implementation compliance.

## Impact

- **Config files**: `tsconfig.app.json`, `tsconfig.node.json`, `vitest.config.ts`
- **Dependencies**: Update vitest to v3, add `@types/node`
- **Source files**: `src/services/sheets/read.ts`, `src/services/sheets/client.ts`, `src/services/sheets/connection.ts`, `src/services/sheets/createSpreadsheet.ts`, `src/types/money.test.ts`
- **Test files**: `src/App.test.tsx`, `src/components/AuthStatus.test.tsx`
- **New files**: `.cursor/rules/quality-gate.mdc` (Cursor rule)
