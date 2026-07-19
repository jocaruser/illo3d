# ADR-0014: Public specs wiki, rendered from GitHub at view time

- Status: Accepted
- Date: 2026-07-18
- Amends: ADR-0007

## Context

`specs/` is the canonical behaviour record (ADR-0008),
but as raw files it is only comfortably readable by people who browse GitHub.
The specs should be publicly and easily available:
navigable, searchable, translatable,
and consultable at the exact state of any release, branch head, or commit —
and a spec edit must publish without any build or release,
because the wiki's code does not change when `.md` files change.

## Decision

Publish `specs/` through **github-md-live-wiki**
([jocaruser/github-md-live-wiki](https://github.com/jocaruser/github-md-live-wiki)),
a free, MIT-licensed, content-agnostic wiki engine
maintained to this repository's engineering standards,
whose own GitHub Pages hosts the live instance:
`https://jocaruser.github.io/github-md-live-wiki/`.

- The wiki is a static shell that **fetches `specs/` from GitHub at view
  time**: file bodies from raw content, tag/branch/tree listings from the
  GitHub API. Merged spec changes are visible immediately;
  nothing in this repository deploys, builds, or triggers anything for them.
- Its version menu offers **latest** (`main`), every **release tag**,
  every **branch head**, and **any commit id** —
  each rendered live at that ref —
  plus search and on-device automatic translation.
  Links leaving `specs/` open the file on GitHub at the matching ref;
  forward references to planned pages
  (sanctioned by the `specs/README.md` checklist)
  resolve to a friendly not-found notice.
- illo3d's entire integration is one Compose service (`wiki`,
  behind a profile so it never starts implicitly) running the engine's
  image from GHCR on its **major-version tag** (`:v1` — engine bugfixes
  flow in on the next pull; breaking engine changes require a deliberate
  bump here). `make wiki` starts it on port 5176 with the working-tree
  `specs/` mounted as a **local** entry in the version menu.
- This repository's own Pages deployment (ADR-0007) is unchanged
  and carries the app only.

## Consequences

- Spec changes become public the moment they merge, with zero deploys;
  the wiki needs attention only when the engine itself changes.
- Readers' browsers talk to GitHub directly:
  no prerendered HTML for crawlers, and the unauthenticated GitHub API
  allowance (60 requests/hour/IP) bounds how many distinct versions one
  reader can open per hour — ample for human browsing.
- The wiki's availability rests on GitHub Pages plus the engine
  repository; retiring or replacing it never touches illo3d beyond the
  one Compose service and this ADR.
