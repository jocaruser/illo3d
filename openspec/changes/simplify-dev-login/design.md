## Context

The current Dev Login flow uses a Google Service Account to obtain a real access token:

1. `vite.config.ts` reads SA JSON file at build time → injects `VITE_SA_CLIENT_EMAIL` and `VITE_SA_PRIVATE_KEY`
2. `devLogin.ts` signs a JWT with `jose` → exchanges it at Google's token endpoint → returns access token
3. `LoginPage.tsx` calls `exchangeSaToken()`, sets auth state, optionally validates a folder via `VITE_SA_FOLDER_ID`

This requires SA key management, build-time credential injection, the `jose` dependency, and network calls to Google during dev login. With E2E tests moving to fully-mocked APIs, none of this complexity is needed.

## Goals / Non-Goals

**Goals:**

- Dev Login becomes a zero-config, zero-network, synchronous operation
- Remove all SA-related env vars, build-time injection, and dependencies
- Dev Login sets both auth and shop state in one click (no wizard)
- Keep Dev Login dev-only (`import.meta.env.DEV` guard unchanged)

**Non-Goals:**

- Changing Google OAuth flow for production users
- Modifying the setup wizard itself
- Making the fake token work against real Google APIs

## Decisions

### D1: Inline fixture data instead of env vars

Replace all env-var-driven configuration with hardcoded fixture constants in a single file (`src/services/auth/devLogin.ts`). The fixture includes a fake token, fake user, and fake shop data.

**Why over env vars**: Zero config for any developer cloning the repo. No `.env` setup needed for Dev Login. The fixture data is meaningless outside the app's own state — it never hits real APIs.

### D2: Synchronous state injection instead of async token exchange

`devLogin.ts` exports a function that returns fixture data directly — no async, no network, no JWT signing. `LoginPage.tsx` calls it, sets both stores, and navigates.

**Why over keeping async**: There is nothing to await. Removing the async flow eliminates loading states, error handling for network failures, and the entire `jose` interaction. The Dev Login button click becomes instant.

### D3: Set shop state from Dev Login handler in LoginPage

The `handleDevLogin` function in `LoginPage.tsx` sets both `authStore` (user + credentials) and `shopStore` (active shop) before navigating. This keeps the wizard-bypass logic co-located with login logic rather than spreading it across components.

**Why over a separate bypass mechanism**: The shop state is just another piece of fixture data injected at login time. No need for a separate system to detect "dev mode shop bypass."

### D4: Remove `jose` dependency entirely

`jose` is only used by `devLogin.ts` for JWT signing. With the SA flow removed, it has no other consumers in the codebase.

### D5: Clean up vite.config.ts

Remove the `loadSaCredentials()` function and the three SA-related `define` entries. The `VITE_SA_FOLDER_ID` define is also removed since shop data is now hardcoded in fixtures.

## Risks / Trade-offs

[Dev Login no longer works with real Google APIs] → Acceptable. Developers who need real API access use Google OAuth. Dev Login is now exclusively for quick UI iteration and E2E tests.

[Hardcoded fixture data could drift from real data shapes] → The fixture uses the same TypeScript types (`User`, `Shop`) as the real flow, so type checking catches shape mismatches.

[Removing loading state changes UX slightly] → The login was near-instant anyway (~1s for SA token exchange). Now it is truly instant. No user impact.
