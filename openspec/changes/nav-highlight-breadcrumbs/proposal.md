## Why

Users lose context when moving between Clients, Jobs, Transactions, Expenses, and Inventory: the top bar looks the same on every page, and there is no in-page trail showing where they are. Clear active navigation and breadcrumbs reduce wrong clicks and make the app easier to scan.

## What Changes

- Top navigation links reflect the current route: the active section uses distinct styling (not only hover).
- Introduce a reusable **breadcrumbs** component (generic API: ordered segments with optional links and a current page label).
- Render breadcrumbs on every main app screen that uses the authenticated layout (Clients, Jobs, Transactions, Expenses, Inventory, and the default post-login landing flow as applicable), with labels consistent with i18n where other chrome uses translations.
- Login and setup flows may omit breadcrumbs if they are outside the main shell; the spec will state exactly which surfaces include them.

## Capabilities

### New Capabilities

- `app-navigation`: Top bar active state for primary routes; shared breadcrumbs component; placement and content rules for main pages.

### Modified Capabilities

- _(none — no existing spec defines navigation chrome; requirements live in the new capability.)_

## Impact

- `src/App.tsx` (Layout / nav links).
- New component under `src/components/` (e.g. `Breadcrumbs.tsx`) and any small helper for nav link styling.
- Page components or a shared page header pattern for Clients, Jobs, Transactions, Expenses, Inventory (and root redirect target if it shows chrome).
- Tests: component/unit tests for breadcrumbs and optionally a thin test that active nav matches route.
- Locales: breadcrumb labels if they are user-visible strings already translated elsewhere.
