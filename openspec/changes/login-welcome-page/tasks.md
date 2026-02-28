## 1. Route Guard

- [x] 1.1 Create `src/components/ProtectedRoute.tsx` — reads `isAuthenticated` from `useAuthStore`, redirects to `/login` preserving the requested path via React Router `location` state
- [x] 1.2 Wrap all existing routes (except `/login`) with `ProtectedRoute` in `src/App.tsx`

## 2. Login Page

- [x] 2.1 Create `src/pages/LoginPage.tsx` — centered layout with illo3d branding, tagline, and Google sign-in (One Tap + fallback button). Redirect authenticated users to the return path or `/transactions`
- [x] 2.2 Add `/login` route in `src/App.tsx` as a public route (outside `ProtectedRoute`)
- [x] 2.3 Redirect `/` to `/transactions` for authenticated users

## 3. Update AuthStatus Component

- [x] 3.1 Remove sign-in UI (One Tap + fallback button) from `src/components/AuthStatus.tsx` — keep only signed-in state display and sign-out button

## 4. i18n

- [x] 4.1 Add login page translation keys to `src/locales/en.json` (`login.title`, `login.tagline`)
- [x] 4.2 Add login page translation keys to `src/locales/es.json`

## 5. Routing Cleanup

- [x] 5.1 Update `src/App.tsx` — restructure routes into public (`/login`) and protected groups, remove the inline `Home` component, redirect `/` to `/transactions`
