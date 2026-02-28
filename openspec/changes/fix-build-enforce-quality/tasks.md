## 1. Fix dependency and config issues

- [x] 1.1 Run `make add-dev PKG=@types/node` to add Node.js type declarations
- [x] 1.2 Add `"types": ["node"]` to `compilerOptions` in `tsconfig.node.json`
- [x] 1.3 Move `"types": ["vitest/globals"]` from root level into `compilerOptions` in `tsconfig.app.json`
- [x] 1.4 Run `make add-dev PKG=vitest@latest` to upgrade vitest to v3 (vite 6 compatible)

## 2. Fix TypeScript build errors in source files

- [x] 2.1 Change generic constraint from `T extends Record<string, unknown>` to `T extends object` in `rowToObject` and `readSheetRows` at `src/services/sheets/read.ts`
- [x] 2.2 Remove unused import `sheetsFetch` from `src/services/sheets/connection.ts` (line 2)
- [x] 2.3 Remove unused type import `SheetName` from `src/services/sheets/createSpreadsheet.ts` (line 5)
- [x] 2.4 Remove unused type imports `Piece` and `Expense` from `src/types/money.test.ts` (lines 5, 8)

## 3. Fix ESLint lint errors

- [x] 3.1 Remove unnecessary try/catch wrapper in `sheetsFetch` at `src/services/sheets/client.ts` (lines 57-69) — just await and return directly
- [x] 3.2 Verify `make lint` passes with zero errors

## 4. Fix failing tests

- [x] 4.1 Update `src/App.test.tsx` — App now renders LoginPage when unauthenticated. Update the test to check for the i18n key `login.title` instead of the text "illo3d"
- [x] 4.2 Update `src/components/AuthStatus.test.tsx` — AuthStatus now returns null when unauthenticated (sign-in moved to LoginPage). Remove or rewrite the "shows sign-in button when not authenticated" test to verify AuthStatus renders nothing when `isAuthenticated` is false

## 5. Create Cursor quality gate rule

- [x] 5.1 Create `.cursor/rules/quality-gate.mdc` with rules: always use `make` commands (never raw pnpm/docker), run `make build`, `make lint`, and `make test` after changes, all must pass with zero errors

## 6. Verification

- [x] 6.1 Run `make build` and verify exit code 0 with zero errors
- [x] 6.2 Run `make lint` and verify exit code 0 with zero problems
- [x] 6.3 Run `make test` and verify all tests pass with zero failures
- [ ] 6.4 Use browser MCP server to manually verify the app loads correctly at http://localhost:5173
