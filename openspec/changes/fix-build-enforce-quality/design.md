## Context

The project has accumulated build, lint, and test failures across several changes (google-login, money-account, login-welcome-page). The build pipeline (`tsc -b && vite build`) fails with 13 TypeScript errors from 4 root causes. ESLint reports 5 errors. Two tests are stale after the login page refactor. There are no automated guardrails to catch regressions before they accumulate.

## Goals / Non-Goals

**Goals:**
- Achieve zero errors on `make build`, `make lint`, and `make test`
- Establish a Cursor rule that enforces quality gates for all future changes
- Ensure all pnpm/docker interactions go through Makefile commands

**Non-Goals:**
- CI/CD pipelines or GitHub Actions
- Pre-commit hooks (husky/lint-staged)
- New ESLint rules or stricter lint configuration
- Code refactoring beyond what is needed to fix errors

## Decisions

### 1. Update vitest to v3 (over pinning vite version in vitest)

The `vitest.config.ts` type error comes from vitest 2.x bundling vite 5 internally while the project uses vite 6. Upgrading vitest to v3 (which supports vite 6 natively) is cleaner than downgrading vite or adding type casts. The vitest v3 API is backward-compatible for our usage.

### 2. Add `@types/node` (over using import.meta.url workarounds)

`vite.config.ts` and `vitest.config.ts` use `path` and `__dirname` — standard Node.js patterns for Vite configs. Adding `@types/node` and declaring it in `tsconfig.node.json` is the idiomatic fix. The alternative (using `import.meta.url` + `fileURLToPath`) would require rewriting both config files for no functional benefit.

### 3. Relax generic constraint to `object` (over adding index signatures)

`readSheetRows<T extends Record<string, unknown>>` fails because TypeScript interfaces (`Client`, `Transaction`) lack implicit index signatures. Changing the constraint to `T extends object` keeps type safety while accepting interfaces. Adding `[key: string]: unknown` to every domain interface would pollute the type definitions.

### 4. Move `types` to `compilerOptions` in tsconfig.app.json (over separate test tsconfig)

The `"types": ["vitest/globals"]` is at root level instead of inside `compilerOptions`. Simply moving it fixes `vi` recognition in test files. Creating a separate `tsconfig.test.json` would add unnecessary complexity for a one-line fix.

### 5. Cursor rule for quality enforcement (over pre-commit hooks)

A `.cursor/rules/` rule is the lightest-weight enforcement mechanism that applies to the AI-assisted workflow. Pre-commit hooks require husky setup and don't help during AI-driven development. The Cursor rule ensures the AI agent always validates build/lint/test before considering work done.

## Risks / Trade-offs

- **Vitest v3 upgrade may introduce breaking changes** → Vitest v3 has minimal breaking changes for basic test configs. The `globals: true` API and Testing Library integration are unchanged. Run full test suite after upgrade to verify.
- **`T extends object` is less strict than `Record<string, unknown>`** → The internal `rowToObject` function already casts through `Record<string, unknown>`, so the external constraint was providing false safety. The real type safety comes from the return type, not the constraint.
- **Cursor rule is advisory, not enforced at CI level** → Acceptable for now. The rule covers the primary development workflow (AI-assisted). CI enforcement is a documented non-goal for this change.
