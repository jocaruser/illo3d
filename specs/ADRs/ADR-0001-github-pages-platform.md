# ADR-0001: GitHub Pages as the deployment platform

- Status: Accepted
- Date: 2026-07-16

## Context

illo3d is a single-operator tool meant for small shops. It needs hosting that is free, zero-maintenance and deploys
from CI — not a server.

## Decision

Ship as a static bundle on GitHub Pages. Deployment is not automatic — it is release-gated: triggered manually or by
the release workflow after creating a GitHub Release.

Everything below follows from "no server at runtime" and must not regress:

- **Deep links** — navigation must work without server-side rewrite rules.
- **Security headers** — must be embedded in the served artifact; there is no server to set them.
- **No server-side secrets** — all configuration must be supplied at build time.
- **Dev-only dependencies** — must never leak into the production bundle.

## Consequences

- Zero hosting cost or operations; deployment is intentional (release-gated) by construction.
- No backend means no server-side observability, backups or sessions — those dimensions are
  scoped accordingly in the README commitment (O1, B1) with data safety delegated to the
  user's own storage plus the migration wizard's backups (ADR-0009).
- Anything requiring a server (webhooks, scheduled jobs, shared multi-user state) is out of
  architecture until this ADR is superseded.
