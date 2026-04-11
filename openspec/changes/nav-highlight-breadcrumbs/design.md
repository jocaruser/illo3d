## Context

The app shell in `App.tsx` renders a header with plain `Link` components to `/clients`, `/jobs`, `/transactions`, `/expenses`, and `/inventory`. All links use the same gray styling, so the current section is not obvious. Main content has no breadcrumb trail. React Router is already used for routing and guards.

## Goals / Non-Goals

**Goals:**

- Show a clear **active** style on the header link whose path matches the current route (including nested paths if any are introduced later; exact match is acceptable for current flat routes).
- Provide a **reusable** `Breadcrumbs` presentation component with a small, explicit props API.
- Show breadcrumbs on every screen rendered inside the authenticated **Layout** (the same surfaces that show the main top nav): Clients, Jobs, Transactions, Expenses, Inventory. Omit breadcrumbs on `/login` and on full-screen flows that do not use the main header (e.g. setup wizard overlay), unless product later decides otherwise.

**Non-Goals:**

- Deep hierarchical URLs with multi-level dynamic crumbs (e.g. `/clients/:id/edit`) — only what exists today plus a pattern that can grow.
- Changing information architecture or renaming routes.
- Mobile-specific nav patterns (hamburger, etc.).

## Decisions

1. **Active nav styling** — Use React Router’s `NavLink` (or equivalent) with a `className` function that applies distinct Tailwind classes for active vs inactive states, reusing existing gray palette and font size for inactive links. **Rationale:** Built-in `aria-current` behavior and path matching; no custom subscription to history. **Alternative:** `useLocation()` + manual `pathname === '/clients'` — more boilerplate per link.

2. **Breadcrumbs API** — `Breadcrumbs` accepts an ordered list of items: `{ label: string; to?: string }[]`. Items with `to` render as links; the last item SHALL be the current page and SHALL NOT include `to` (rendered as plain text). **Rationale:** Keeps the component dumb and easy to test; parents or a thin helper supply labels (including i18n). **Alternative:** `children` slots — more flexible but heavier for every page.

3. **Where labels come from** — Prefer a single place (e.g. helper next to routes or a small map keyed by `pathname`) that returns breadcrumb items using `useTranslation()`, so pages are not each duplicating `[home, current]`. Pages that need custom trails later can pass items explicitly. **Rationale:** Satisfies “everywhere” with one implementation touch per route addition. **Alternative:** Each page renders its own `<Breadcrumbs />` — simpler mentally but duplicated and easy to forget.

4. **Placement** — Breadcrumbs sit **below** the global header and **above** page content, inside the layout wrapper, full width within the same `max-w-7xl` container as the header for visual alignment. **Rationale:** Consistent chrome without changing every page file if the helper is centralized; if the helper lives in `Layout`, only route keys need updates when adding pages.

5. **Accessibility** — Breadcrumbs wrapped in `<nav aria-label="Breadcrumb">` (or localized equivalent via `aria-label` from i18n). Current page indicated for AT (e.g. `aria-current="page"` on the last segment).

## Risks / Trade-offs

- **[Risk] Drift between routes and breadcrumb config** → Mitigation: colocate config with `App.tsx` routes or a `routes.ts` module; add a unit test that listed paths have entries.
- **[Risk] `NavLink` end prop** — For `/` vs prefix matches, use `end` where needed so `/` does not highlight every route. **Mitigation:** Only primary section links use `NavLink`; logo link can stay `Link` to `/`.

## Migration Plan

No data migration. Ship as a normal frontend deploy; rollback by reverting the commit.

## Open Questions

- Whether the first crumb should be the product name vs “Home” and which path it targets (likely `/transactions` as the default post-login hub, consistent with `RootRedirect`).
