# ADR-0014: Google mocking for e2e and dev — an external emulator

- Status: Draft
- Date: 2026-07-19

## Context

The Google Drive backend was tested through hand-written Playwright
route stubs (`mockDriveApis`):
canned responses, fixed ids, no real state behind them.
Stub behaviour drifts from Google behaviour,
stateful flows (create → list → read, the migration rename dance)
cannot be expressed,
and Google-backend e2e could not follow the model
the local-csv backend enjoys —
seed files, exercise the app, assert on the final files.

The app touches a small, fully mapped surface:
six Drive v3 methods plus multipart upload,
and six Sheets v4 operations.

Existing tools were evaluated (2026-07-19)
before building anything:
`pubkey/google-drive-mock` (active but RxDB-scoped,
create/get only, no Sheets, no disk-state contract),
`christophd/simulator-google-sheets` (canned scenarios, no Drive,
dormant), WireMock/Mockoon/MockServer/HAR replay
(stateless stubbing by design),
and the official Google emulators
(Cloud Platform APIs only — no Workspace emulator exists,
official or community).
Nothing combines Drive v3 and Sheets v4 with seedable real state.

## Decision

Google is mocked by
[google-drive-api-mock](https://github.com/jocaruser/google-drive-api-mock),
a purpose-built emulator maintained in its own repository
under the same spec-driven standards as this one,
and consumed here as a pinned git devDependency.

Its state is plain files
(a mirrored Drive tree, one CSV per sheet tab),
so Google-backend e2e is state-based:
`tests/e2e/helpers/fakeGoogle.ts` mounts the emulator
behind `page.route`, rooted in each test's output directory;
tests seed by writing files and assert by reading them.
OAuth/GIS stays with `mockGoogleOAuth` —
only the data plane is emulated.

For dev mode, `pnpm run google-mock` starts the emulator
as an HTTP server (state in `.google-mock-data/`),
and the app is pointed at it via the `VITE_GOOGLE_*_API_BASE`
overrides whose inline defaults remain the real Google URLs.
A `make` target wiring dev mode end to end is planned follow-up.

Production exclusion is layered:
Vite only bundles what `src/` imports,
ESLint forbids `src/` from importing the emulator package,
and CI plus the Pages deploy grep the built `dist/`
for `google-drive-api-mock` before anything is uploaded.

## Consequences

- Google-backend e2e runs the full production stack
  (repositories, `GoogleApiClient`, `authorizedFetch`)
  against real emulated state;
  scenario setup is data, not per-endpoint stubbing.
- The two repositories co-evolve deliberately:
  when this app adopts a new Google endpoint or clause,
  the emulator (which fails loudly outside its surface)
  must learn it first, then the lockfile pin advances here —
  two small PRs instead of one, accepted for the reuse
  and clean boundary a separate repository buys.
- `tests/Unit/FakeGoogle/csvCompat.test.ts` is a contract test:
  the emulator's CSV dialect and `LocalCsv/Csv.ts`
  must stay interchangeable, so golden fixtures
  keep working on both backends.
- The emulator's disk layout is public API of that repository;
  fixture-breaking changes arrive only through
  a deliberate dependency bump.
