## Context

Currently, all routes (`/`, `/transactions`) are accessible without authentication. The `AuthStatus` component in the header handles both sign-in (One Tap + fallback) and sign-out. There is no concept of public vs protected routes — the app renders all pages regardless of auth state.

The auth store (`useAuthStore`) already provides `isAuthenticated` state persisted in `sessionStorage`, which gives us a reliable signal for route protection.

## Goals / Non-Goals

**Goals:**

- Create a public login/welcome page as the single unauthenticated entry point
- Protect all other routes behind an auth guard that reads from `useAuthStore`
- Move sign-in UI (One Tap + fallback button) from the header to the login page
- Redirect authenticated users away from the login page to the app

**Non-Goals:**

- Server-side auth verification (SPA-only guard)
- Role-based access or permission levels
- Token refresh or expiration handling (deferred)
- Redesign of existing pages (Transactions, Home)

## Decisions

### 1. Route guard as a wrapper component (`ProtectedRoute`)

**Decision**: Create a `ProtectedRoute` component that wraps children and redirects to `/login` if not authenticated.

**Rationale**: React Router v7 supports layout routes. A wrapper component is the idiomatic pattern — it composes naturally with `<Routes>` and keeps the routing tree in `App.tsx` declarative. Alternatives like a custom hook returning early would scatter guard logic across every page.

**Alternatives considered**:
- Higher-order component (HOC) — less idiomatic in modern React, harder to compose
- Middleware/loader pattern (React Router v7 data APIs) — overkill for client-side-only check, adds complexity

### 2. Login page owns all sign-in UI

**Decision**: Move Google One Tap initialization and the fallback `GoogleLogin` button into a new `LoginPage` component. `AuthStatus` in the header will only show the signed-in state and sign-out button.

**Rationale**: With a route guard, unauthenticated users never see the header. Keeping sign-in UI in the header adds dead code for authenticated users and splits the login experience across two components. The login page becomes the single source of sign-in.

### 3. Route structure: `/login` public, everything else protected

**Decision**: Add `/login` as the only public route. The root `/` redirects to `/transactions` (the current default authenticated view). All other routes are wrapped in `ProtectedRoute`.

**Rationale**: The current Home page at `/` is a placeholder ("Welcome to illo3d"). Rather than creating a separate dashboard, redirect to `/transactions` which is the main functional page. The login page at `/login` replaces the welcome content with a branded sign-in experience.

**Alternatives considered**:
- Keep `/` as authenticated home — adds an empty page that users skip anyway
- Use `/` for login — conflicts with typical SPA patterns where `/` is the default authenticated landing

### 4. Login page design: centered card with branding

**Decision**: A centered layout with illo3d logo/name, a brief tagline, and the Google sign-in options. Tailwind CSS only, no new dependencies.

**Rationale**: Matches the existing Tailwind-based styling. A minimal branded page keeps focus on the single call-to-action (sign in). No need for a component library for one page.

## Risks / Trade-offs

- **[Client-side only guard]** → Users could bypass by manipulating sessionStorage. Acceptable because Google Sheets API calls require valid tokens regardless — data access is still server-protected.
- **[Session expiration]** → If the Google token expires mid-session, API calls fail but the route guard still shows authenticated. Mitigation: deferred to a future change (token refresh/expiration handling).
- **[One Tap behavior on `/login`]** → Google One Tap may not trigger on page load if the user previously dismissed it. Mitigation: the fallback button is always visible after a short delay, same pattern as current `AuthStatus`.
