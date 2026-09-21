# Google Drive/Sheets e2e mocking with a live emulator

## Context

The Google Drive backend's e2e coverage never crosses a real network
boundary: every Drive v3 and Sheets v4 request the app makes during those
tests is intercepted in-process (Playwright `page.route`) and answered with
a hand-written, per-endpoint stub. The Drive backend is one of the two
storage backends the product supports, and it is the one real users' data
actually lives in, so a break in the real request or response shape — a
header, a status code, a body field, an ordering the app relies on — can
pass the whole suite while breaking the product for anyone using that
backend. An in-process stub also holds no state between requests, so a
stateful sequence (create, then list, then read; rename or move; overwrite)
cannot be faithfully represented, and the Google-backend migration engine's
own `copyFile`/`renameFile`/`deleteFile` calls were never exercised to
completion by any e2e spec.

## Decision

The e2e suite exercises the Drive backend against `google-drive-api-mock`
(`ghcr.io/jocaruser/google-drive-api-mock`, pinned tag `v0.2.1`, with the
matching npm-unpublished package pinned by commit
`d93eca11a4e7f68354a21f214c960d575d5e539a`) — a disk-backed, out-of-process
double reached over real HTTP, not a second in-process interception layer.
No general-purpose tool combines stateful Drive v3 and Sheets v4 emulation
in one place, so a purpose-built double for the app's narrow, fully-mapped
surface is the pragmatic choice.

`src/Repository/GSheet/GoogleApiClient.ts` gains an env-var override seam
on its three hardcoded base URLs
(`VITE_GOOGLE_DRIVE_API_BASE`, `VITE_GOOGLE_DRIVE_UPLOAD_API_BASE`,
`VITE_GOOGLE_SHEETS_API_BASE`), defaulting to the real Google hosts.
`vite-plugins/csp-connect-src.ts` extends `index.html`'s CSP `connect-src`
with the origin of any set override, derived from the same three env vars,
so the CSP cannot drift from what the app actually fetches. `make e2e-test`
brings up a `google-mock` compose service (pinned image, no host port —
reached only by service name inside the compose network) and points the
e2e-only production build at it via those three env vars.
`tests/e2e/helpers/mockDriveApis.ts` seeds and resets the emulator's
`DriveStore` directly instead of stubbing routes, so a scenario is seeded as
data rather than as a new per-endpoint stub.

Two gotchas the emulator's own behaviour and Chromium's own networking
stack impose:

- **Chromium's async DNS resolver can hang indefinitely (no error, no
  timeout) resolving the `google-mock` compose hostname**, even though
  `curl`/`wget` and Vite's own dev server resolve it instantly.
  `playwright.config.ts` disables it
  (`--disable-features=AsyncDns,DnsOverHttps`).
- **Resetting the shared data directory must clear its contents, never
  delete-and-recreate the directory itself.** `google-mock` bind-mounts the
  same host path from an already-running container; deleting and recreating
  the directory leaves that container's mount pointed at a now-orphaned
  inode, so its view of the path goes stale rather than reflecting new
  writes. `tests/e2e/helpers/fakeGoogle.ts`'s `resetGoogleMock` iterates and
  removes the directory's entries, never the directory node.

## Consequences

- The double, and anything used only to drive it, is excluded from what a
  production build ships, layered three ways: nothing in `src/` imports it
  (Vite only bundles what `src/` imports); `eslint.config.js`'s
  `no-restricted-imports` rule makes that a build-time error rather than an
  absence that could regress silently; and CI's `build` job and the Pages
  `deploy` job each grep the built `dist/` for the emulator package name as
  an independent tripwire.
- `tests/Unit/FakeGoogle/csvCompat.test.ts` is a standing contract between
  the emulator's own CSV codec and `src/Repository/LocalCsv/Csv.ts`: the two
  must round-trip the same tricky matrix identically, because the app reads
  both the emulator's tab files (in e2e) and its own local CSV files (in
  production) through the same schema expectations.
- The app and the pinned emulator version co-evolve: a future Drive/Sheets
  clause the app needs to send advances the pinned emulator version (image
  tag and package commit) first, in its own change, before the app change
  that depends on it.
