## ADDED Requirements

### Requirement: Build produces zero errors

The TypeScript compiler and Vite bundler SHALL complete without errors when running `make build`. All type errors, unused variable warnings, and configuration issues MUST be resolved.

#### Scenario: Clean TypeScript compilation
- **WHEN** developer runs `make build`
- **THEN** `tsc -b` completes with exit code 0 and no error output

#### Scenario: Vite bundle succeeds
- **WHEN** TypeScript compilation passes
- **THEN** `vite build` produces a `dist/` directory with bundled assets

### Requirement: Linter reports zero errors

ESLint SHALL report zero errors and zero warnings when running `make lint`. All unused imports, unused variables, and code quality violations MUST be resolved.

#### Scenario: Clean lint run
- **WHEN** developer runs `make lint`
- **THEN** ESLint exits with code 0 and reports 0 problems

### Requirement: All tests pass

The full test suite SHALL pass when running `make test`. Stale tests MUST be updated to match current component behavior.

#### Scenario: Full test suite passes
- **WHEN** developer runs `make test`
- **THEN** vitest reports all test files passed with 0 failures

### Requirement: Cursor rule enforces quality gates

A Cursor rule SHALL exist that instructs AI agents to validate build, lint, and test results before considering implementation complete. The rule SHALL also enforce that all pnpm and docker commands are executed through Makefile targets.

#### Scenario: AI agent validates quality after changes
- **WHEN** AI agent completes a code change
- **THEN** the agent runs `make build`, `make lint`, and `make test` to verify zero errors before finishing

#### Scenario: AI agent uses Makefile commands
- **WHEN** AI agent needs to install a dependency
- **THEN** the agent uses `make add PKG=<name>` instead of `pnpm add <name>` or `docker compose exec app pnpm add <name>`

#### Scenario: AI agent uses Makefile for all operations
- **WHEN** AI agent needs to run any development command (dev, build, test, lint, format, install)
- **THEN** the agent uses the corresponding `make` target instead of running pnpm or docker commands directly
