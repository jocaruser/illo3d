## Why

The app currently allows unauthenticated users to access all routes (Home, Transactions). Since illo3d manages sensitive business data (CRM, finances), every page except the login/welcome page should require Google authentication. A dedicated public landing page also provides a clear entry point and brand presence.

## What Changes

- Add a public login/welcome page at `/` that serves as the only unauthenticated route. It should present the illo3d brand and Google sign-in options.
- Introduce a route guard that redirects unauthenticated users to the login page when they try to access any other route.
- Move the current Home content behind authentication; authenticated users landing on `/` get redirected to a default authenticated route (e.g. `/dashboard` or `/transactions`).
- Remove auth controls from the header layout (sign-in is handled by the login page; sign-out stays).

## Non-goals

- Custom username/password authentication — Google OAuth remains the only auth method.
- Role-based access control or permissions — all authenticated users have full access.
- Server-side route protection — this is a client-side SPA guard only.
- Redesigning existing authenticated pages.

## Capabilities

### New Capabilities

- `route-guard`: Client-side route protection that restricts access to authenticated users only, redirecting unauthenticated visitors to the login page.
- `login-page`: Public welcome/login page with illo3d branding and Google sign-in integration (One Tap + fallback button).

### Modified Capabilities

- `google-auth`: Auth status display moves from the global header to the login page for sign-in; the header retains only the signed-in state and sign-out action.

## Impact

- `src/App.tsx` — Routing restructured: public vs protected route groups, new login page route.
- `src/components/AuthStatus.tsx` — Simplified to show only signed-in state and sign-out (no sign-in UI in header).
- `src/pages/LoginPage.tsx` — New page component.
- `src/components/RouteGuard.tsx` — New component wrapping protected routes.
- `src/stores/authStore.ts` — May need a helper selector for route guard checks.
- `src/locales/en.json`, `src/locales/es.json` — New i18n keys for login page text.
