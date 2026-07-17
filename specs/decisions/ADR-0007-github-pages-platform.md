# ADR-0007: GitHub Pages as the deployment platform

- Status: Accepted
- Date: 2026-07-16

## Context

illo3d is a single-operator tool whose data lives in the user's own storage (Google Drive or
a local folder). It needs hosting that is free, zero-maintenance and deploys from CI — not a
server.

## Decision

Ship as a static bundle on GitHub Pages, deployed by GitHub Actions on every push to `main`.
Everything below follows from "no server at runtime" and must not regress:

- **HashRouter** — deep links (`/#/clients/CL1`) must resolve with no rewrite rules.
- **Base path `/illo3d/`** in production builds (`/` in dev).
- **No server-side secrets**: `VITE_GOOGLE_CLIENT_ID` is injected at build time; the Google
  OAuth `drive.file` scope limits blast radius.
- **Security headers as `index.html` meta tags** (CSP allowlisting Google Identity and the
  Sheets/Drive APIs, `frame-ancestors 'none'`, `nosniff`, restrictive Permissions-Policy).
  Theme init runs from the bundle so `script-src` never needs `'unsafe-inline'`.
- The Vite dev plugins that serve/write fixture CSVs are dev/e2e-only and must never become a
  production dependency.

## Consequences

- Zero hosting cost or operations; deployment is Y2 (automated from CI) by construction.
- No backend means no server-side observability, backups or sessions — those dimensions are
  scoped accordingly in the README commitment (O1, B1) with data safety delegated to the
  user's own storage plus the migration wizard's backups (ADR-0004).
- Anything requiring a server (webhooks, scheduled jobs, shared multi-user state) is out of
  architecture until this ADR is superseded.
