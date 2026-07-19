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
under the same spec-driven standards as this one.
The app reaches it exactly as it reaches real Google —
over HTTP, via the `VITE_GOOGLE_*_API_BASE` overrides
whose inline defaults remain the real Google URLs —
so pointing at the mock is a base-URL swap at the network
layer, not a new code path in the app.
Two things had to change alongside the app code
for that swap to actually work inside a browser
(see Gotchas below): the CSP `connect-src` directive
has to allow the mock's origin,
and Chromium's own DNS resolver needed a launch flag
to resolve the mock's hostname reliably at all.

For **e2e**, `docker-compose.yml` runs the emulator
as a `google-mock` service pulled by pinned tag
(`ghcr.io/jocaruser/google-drive-api-mock:v0.2.1`,
not built from source);
`make e2e-test` starts it alongside the app,
waits for it to accept connections
(the same pattern already used for the e2e Vite server),
and points the e2e Vite build at
`http://google-mock:8790/…`.
Its data directory is bind-mounted at a path both the
`app`/`playwright` containers and the `google-mock`
container see, so tests seed and assert with plain
filesystem calls while the app drives the real HTTP surface.
`google-drive-api-mock` is also a pinned devDependency,
purely for its `DriveStore` seeding class and CSV codec —
never for mounting the emulator in-process.
`tests/e2e/helpers/fakeGoogle.ts` resets that directory
per scenario; OAuth/GIS stays with `mockGoogleOAuth` —
only the data plane is emulated.

For **dev mode**, the same image runs the same way —
`pnpm run google-mock` locally, or the same `google-mock`
service — with state in `.google-mock-data/`.
One mechanism serves both.

Production exclusion is layered:
Vite only bundles what `src/` imports,
ESLint forbids `src/` from importing the emulator package,
and CI plus the Pages deploy grep the built `dist/`
for `google-drive-api-mock` before anything is uploaded.

### Gotchas discovered wiring this up (2026-07-19)

Two real, non-obvious failure modes surfaced while switching
e2e onto the live service, both fixed and worth recording
so a future edit does not reintroduce them:

- **CSP blocks the mock outright.**
  `index.html`'s Content-Security-Policy `connect-src`
  is hardcoded to the real Google hosts;
  without an addition the browser refuses to `fetch()`
  the mock at all (a silent, instant rejection).
  `vite-plugins/csp-connect-src.ts` appends the origins of
  any set `VITE_GOOGLE_*_API_BASE` overrides at build time,
  deriving them from the same env vars `GoogleApiClient.ts`
  reads — one source of truth. Production defines no
  overrides, so the shipped CSP is unchanged; the plugin
  validates its `index.html` marker on every build
  (production included) so a future CSP edit that drops
  the marker fails loudly instead of silently disarming
  the mechanism the day someone sets an override.
- **Chromium's own resolver can hang on the compose
  hostname.** Plain `curl`/`wget` inside the containers
  resolve and reach `google-mock` instantly; Chromium's
  built-in async DNS resolver was observed hanging
  indefinitely (no error, no timeout) on the exact same
  hostname. `playwright.config.ts` disables it
  (`--disable-features=AsyncDns,DnsOverHttps`), forcing
  standard OS-level resolution.
- **Resetting the shared data directory the "obvious" way
  hangs the server.** `resetGoogleMock()` must clear the
  directory's *contents*, never delete-and-recreate the
  directory itself (`fs.rmSync` on the directory, then
  `mkdir`) — `google-mock` bind-mounts that same host path
  from a second, already-running container, and doing so
  can leave that container's view of the path stale on
  Docker Desktop/WSL2, hanging its requests indefinitely.
  See the comment on `resetGoogleMock` in
  `tests/e2e/helpers/fakeGoogle.ts`.

## Consequences

- Google-backend e2e runs the full production stack
  (repositories, `GoogleApiClient`, `authorizedFetch`,
  real CORS preflights) against a real HTTP server
  with real emulated state;
  scenario setup is data, not per-endpoint stubbing.
- illo3d's own change to adopt this was minimal by design:
  one compose service, three env vars in the e2e Vite
  invocation, and seed helpers rewritten to write files
  instead of stubbing responses — no new test framework.
- The two repositories co-evolve deliberately:
  when this app adopts a new Google endpoint or clause,
  the emulator (which fails loudly outside its surface)
  must learn it first, then the pinned tag advances here —
  two small changes instead of one, accepted for the reuse
  and clean boundary a separate repository buys.
- `tests/Unit/FakeGoogle/csvCompat.test.ts` is a contract test:
  the emulator's CSV dialect and `LocalCsv/Csv.ts`
  must stay interchangeable, so golden fixtures
  keep working on both backends.
- The emulator's disk layout and HTTP contract are public API
  of that repository; breaking changes arrive only through
  a deliberate version bump here.
