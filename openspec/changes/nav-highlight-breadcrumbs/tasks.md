## 1. Breadcrumbs component

- [ ] 1.1 Add `src/components/Breadcrumbs.tsx` with props `items: { label: string; to?: string }[]`, `<nav aria-label=...>`, separators, and `aria-current="page"` on the last segment
- [ ] 1.2 Add `src/components/Breadcrumbs.test.tsx` covering link vs current segment and accessible name

## 2. Layout: active nav and breadcrumb trail

- [ ] 2.1 Replace section `Link` components with `NavLink` in `src/App.tsx` `Layout`, using `className` for active/inactive Tailwind styles and correct `end` behavior so the logo route does not light up all pages
- [ ] 2.2 Add a small helper or map (e.g. `getBreadcrumbItems(pathname, t)`) colocated with routing that returns items per `/clients`, `/jobs`, `/transactions`, `/expenses`, `/inventory`
- [ ] 2.3 Render `<Breadcrumbs />` below the header inside the same max-width container as the header, above `{children}`, only when `pathname` matches a main layout route (not `/login`)

## 3. i18n

- [ ] 3.1 Add translation keys in `src/locales/en.json` and `src/locales/es.json` for breadcrumb `aria-label` and any shared crumb labels (e.g. app/home) used by the helper

## 4. Tests and verification

- [ ] 4.1 Add or extend unit tests (e.g. `App` or layout-focused test) asserting active class or `aria-current` on the correct `NavLink` for a given route
- [ ] 4.2 Add Playwright coverage in `tests/e2e/` for active nav on at least two routes and breadcrumbs visible on main pages, and absence on `/login`
- [ ] 4.3 Run `make quality-gate` and fix any lint, unit, or e2e failures
