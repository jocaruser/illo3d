# ADR-0008: Semantic versioning with a bump in every pull request

- Status: Accepted
- Date: 2026-07-17

## Context

The app carries one version constant
(`APP_VERSION` in `src/Config/version.ts`),
and every shop records the version that created or last upgraded it
in its metadata file.
ADR-0009 defines what the *major* number means for shops:
a shop whose major differs from the app's cannot open
without the migration wizard.
The habit of bumping the version in every pull request
predates the v3 rewrite
but lived only as an agent rule, never as a recorded decision.

## Decision

The project uses semantic versioning with one bump per pull request:

- **Major** — the shop's data layout changed
  (`schema.dbml` changed with it, per ADR-0002).
  Existing shops require the migration wizard after this.
- **Minor** — new behaviour, no layout change.
  Every existing shop opens unchanged.
- **Patch** — fixes only.
- Every pull request bumps `APP_VERSION` before merge,
  so the deployed version always identifies the exact change set,
  and each release gets a `changelog/v<version>.md` entry.
- New shops are stamped with the `APP_VERSION` that created them;
  the migration wizard is the only thing that ever raises
  a shop's recorded version.

## Consequences

- Only major bumps have shop-side consequences;
  minor and patch releases are invisible to stored data.
- The version comparison the migration wizard performs
  is specified for users in `specs/migration/wizard.spec.md`,
  which links here and to the artefacts involved.
- A shop stamped with a *newer* major than the running app
  cannot be handled by it;
  the intended experience for that case is an open question
  tracked alongside the wizard spec.
