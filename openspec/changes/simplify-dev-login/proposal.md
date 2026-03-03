## Why

The current Dev Login depends on a Google Service Account (SA) — it reads a credentials JSON file at build time, signs a JWT with `jose`, and exchanges it for a real access token against Google's OAuth endpoint. This adds complexity (build-time credential injection in `vite.config.ts`, the `jose` dependency, SA key management) for a feature whose only purpose is to skip the OAuth popup during development. With E2E tests moving to fully-mocked API responses, the SA is no longer needed. A simpler Dev Login that injects a fake token directly achieves the same UX with zero external dependencies.

## What Changes

- **BREAKING**: Remove SA token exchange from Dev Login — `exchangeSaToken()` is replaced by a simple function that returns a hardcoded fake token
- **BREAKING**: Dev Login now bypasses the setup wizard entirely — injects a hardcoded fixture shop (fake folderId, folderName, spreadsheetId) into shopStore alongside auth state
- Remove `jose` dependency
- Remove `loadSaCredentials()` from `vite.config.ts` and the `VITE_SA_CLIENT_EMAIL` / `VITE_SA_PRIVATE_KEY` build-time defines
- Remove all SA-related env vars: `VITE_SA_CREDENTIALS_FILE`, `VITE_SA_FOLDER_ID`, `VITE_SA_CLIENT_EMAIL`, `VITE_SA_PRIVATE_KEY`
- Update `.env.example` to remove SA-related entries
- Simplify `LoginPage.tsx` Dev Login handler — synchronous injection of fake user, fake token, and fixture shop state; navigate directly to main page
- Update unit tests to reflect the simpler flow
- Clean up debug logging (`#region agent log` blocks) in `devLogin.ts`

## Non-goals

- Changing the Google OAuth production login flow
- Removing or modifying the setup wizard for OAuth users — wizard still works normally for Google-authenticated users
- Adding new dev tooling or mock servers

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `dev-login`: SA token exchange is removed. Dev Login injects a fake access token, hardcoded dev user, and fixture shop data directly into stores, with no external API calls. No env vars needed — all fixture values are hardcoded.
- `login-page`: Dev Login button behavior changes — no loading state, no async operations, immediate login with fake credentials and fixture shop, navigates straight to main page (skipping wizard).
- `setup-wizard`: No code changes, but Dev Login users never see the wizard because shop state is pre-populated.

## Impact

- **Dependencies**: Remove `jose` from devDependencies
- **Build config**: `vite.config.ts` simplified — remove `loadSaCredentials()` function and SA-related `define` entries
- **Env vars**: All SA-related vars removed (`VITE_SA_CREDENTIALS_FILE`, `VITE_SA_FOLDER_ID`, `VITE_SA_CLIENT_EMAIL`, `VITE_SA_PRIVATE_KEY`)
- **Services**: `src/services/auth/devLogin.ts` rewritten to a trivial implementation
- **Tests**: `devLogin.test.ts` simplified, `LoginPage.test.tsx` updated
- **Specs**: `dev-login/spec.md` requirements updated to reflect fake-token approach
