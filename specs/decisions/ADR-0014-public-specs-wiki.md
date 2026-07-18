# ADR-0014: Public specs wiki on GitHub Pages

- Status: Draft
- Date: 2026-07-18
- Amends: ADR-0007

## Context

`specs/` is the canonical behaviour record (ADR-0008),
but as raw files it is only comfortably readable by people who browse GitHub.
The specs should be publicly and easily available:
navigable, searchable, and consultable at the exact state of any past release.

## Decision

Publish `specs/` as a VitePress wiki at `https://jocaruser.github.io/illo3d/specs/`,
sharing the single GitHub Pages site the app already occupies (ADR-0007).

- The wiki tooling lives in `wiki/` (config) and `scripts/build-wiki.sh` (build);
  `specs/` itself stays pure markdown, readable with or without the wiki.
- `deploy.yml` builds the app and the wiki into one Pages artifact.
  A push to `main` touching `specs/` or the wiki tooling deploys automatically,
  so spec edits publish on merge, without a release.
  Manual dispatch remains, and the release workflow's existing deploy dispatch
  refreshes the wiki when a release is tagged.
- The wiki's version menu lists **latest** (the tip of `main`)
  plus every release tag whose tree contains `specs/`,
  each built as a frozen snapshot under `/illo3d/specs/<tag>/`.
- The sidebar is generated from the `specs/` tree;
  `specs/changes/` (local-only drafts) is never published.
- Relative links that leave `specs/` open the referenced file on GitHub
  at the ref the page was built from.
- Forward references to planned-but-unwritten pages
  (sanctioned by the checklist in `specs/README.md`)
  stay as unresolved links rather than failing the build.
- Locally, `make wiki-dev` serves the wiki on port 5176 from the app container.

## Consequences

- Spec changes become public the moment they merge; snapshots are immutable release views.
- A push that only touches `specs/` also redeploys the app,
  rebuilt from the same `main` — the site is always a consistent snapshot.
- Wiki pages are static VitePress output and do not carry the app's CSP meta tags;
  ADR-0007's headers govern the app's `index.html` only,
  and the wiki embeds no third-party origins.
- The version menu is empty of snapshots until the first release tagged after this change,
  because earlier tags predate `specs/`.
