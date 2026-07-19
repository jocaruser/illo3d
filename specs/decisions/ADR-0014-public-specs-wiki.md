# ADR-0014: Public specs wiki, rendered from GitHub at view time

- Status: Accepted
- Date: 2026-07-18
- Amends: ADR-0007

## Context

`specs/` is the canonical behaviour record (ADR-0008),
but as raw files it is only comfortably readable by people who browse GitHub.
The specs should be publicly and easily available:
navigable, searchable, and consultable at the exact state of any release,
branch head, or commit —
and a spec edit must publish without any build or release,
because the wiki's code does not change when `.md` files change.

## Decision

Publish `specs/` through **specs-wiki**
([jocaruser/specs-wiki](https://github.com/jocaruser/specs-wiki)),
a separate, content-agnostic wiki engine,
served at `https://jocaruser.github.io/illo3d/specs/`
on the app's own Pages site (ADR-0007).

- The wiki is a static shell that **fetches `specs/` from GitHub at view
  time**: file bodies from raw content, tag/branch/tree listings from the
  GitHub API. Merged spec changes are visible immediately;
  pushes touching only `specs/` trigger **no deploy**.
- Its version menu offers **latest** (`main`), every **release tag**,
  every **branch head**, and **any commit id** —
  each rendered live at that ref.
  Links leaving `specs/` open the file on GitHub at the matching ref;
  forward references to planned pages
  (sanctioned by the `specs/README.md` checklist)
  resolve to a friendly not-found notice.
- illo3d carries **no wiki code**: `deploy.yml` embeds the shell into the
  Pages artifact by running the **pinned** `ghcr.io/jocaruser/specs-wiki:v1`
  image in `export` mode. Engine bugfix releases (rare, manual, in the
  engine repo) flow in through the major tag on the next deploy;
  breaking engine changes require a deliberate pin bump here.
- `deploy.yml` runs on manual dispatch, on the release workflow's existing
  dispatch after tagging, and when the pipeline file itself changes.
- Locally, `make wiki` serves the wiki on port 5176 with the working-tree
  `specs/` mounted as a **local** entry in the version menu.

## Consequences

- Spec changes become public the moment they merge, with zero deploys;
  the wiki needs attention only when the engine itself changes.
- Readers' browsers talk to GitHub directly:
  no prerendered HTML for crawlers, and the unauthenticated GitHub API
  allowance (60 requests/hour/IP) bounds how many distinct versions one
  reader can open per hour — ample for human browsing.
- Wiki pages are static engine output without the app's CSP meta tags;
  ADR-0007's headers govern the app's `index.html` only.
- Retiring or replacing the wiki engine is an edit to `deploy.yml`
  and this ADR, not a code migration inside illo3d.
