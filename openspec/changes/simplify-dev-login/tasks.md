## 1. Rewrite devLogin service

- [x] 1.1 Replace `src/services/auth/devLogin.ts` — remove `jose` JWT signing and token exchange. Export a `getDevFixtures()` function that returns hardcoded `{ user, credentials, shop }` fixture data using existing types (`User` from authStore, shop shape from shopStore)
- [x] 1.2 Rewrite `src/services/auth/devLogin.test.ts` — test that `getDevFixtures()` returns the expected fixture shape with all required fields

## 2. Simplify LoginPage Dev Login handler

- [x] 2.1 Update `handleDevLogin` in `src/pages/LoginPage.tsx` — call `getDevFixtures()`, set `authStore` and `shopStore` synchronously, navigate immediately. Remove async/try-catch, loading state (`devLoginLoading`), and error state (`devLoginError`)
- [x] 2.2 Remove loading spinner and error message UI for Dev Login from the JSX in `LoginPage.tsx`
- [x] 2.3 Update `src/pages/LoginPage.test.tsx` — remove SA-related mocks (`exchangeSaToken`, `validateShopFolder`, `VITE_SA_*` env stubs). Test that clicking Dev Login sets both stores and does not make network calls

## 3. Clean up build config and env vars

- [x] 3.1 Remove `loadSaCredentials()` function and SA-related `define` entries (`VITE_SA_CLIENT_EMAIL`, `VITE_SA_PRIVATE_KEY`, `VITE_SA_FOLDER_ID`) from `vite.config.ts`
- [x] 3.2 Remove SA-related entries from `.env.example` (`VITE_SA_CREDENTIALS_FILE`, `VITE_SA_FOLDER_ID`)
- [x] 3.3 Remove `jose` dependency using `make add-dev PKG=jose` (uninstall)

## 4. Update i18n strings

- [x] 4.1 Remove `devLoginError` and `devLoginLoading` translation keys from `src/locales/en.json` and `src/locales/es.json` (no longer needed since there are no error/loading states)

## 5. Validate

- [ ] 5.1 Run `make build` — verify TypeScript compilation and Vite build succeed with no errors — verify TypeScript compilation and Vite build succeed with no errors
- [x] 5.2 Run `make lint` — verify ESLint reports 0 problems
- [x] 5.3 Run `make test` — verify all unit tests pass
- [ ] 5.4 Use browser MCP server to manually test: open app, click Dev Login, verify immediate redirect to main page with fixture shop active
