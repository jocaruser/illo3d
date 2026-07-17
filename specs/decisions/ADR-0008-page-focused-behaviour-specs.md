# ADR-0008: Store behaviour specs as page-focused, non-technical files

- Status: Proposed
- Date: 2026-07-17

## Context

The v2 spec set (`openspec/specs/`, 46 capability-focused files) drifted badly during the v3
rewrite: it described removed libraries, storage columns and internal module names, so by the
time it was needed as a source of truth it was part lie. The development standards commit this
project to D3 — specs kept in sync with actual behaviour — which requires a format that is
cheap to keep true and survives implementation rewrites.

Two structural options were considered for the replacement: feature-focused files (the
OpenSpec/ai-framework default, one file per capability) and page-focused files (the tree
mirrors what a user navigates). The maintainer thinks in pages, and sync duties are easier to
scope when a change to a screen maps to exactly one file.

## Decision

Behaviour specs live at the repository root under `specs/`, as siblings of — but separate
from — the decision records in `specs/decisions/`.

- **Page-focused tree.** Folders mirror the app's navigation (`jobs/`, `clients/`,
  `dashboard/`, ...), with one file per page region, e.g.
  `specs/jobs/details/widgets.spec.md`. Surfaces that are not pages but are shared by all of
  them (navigation and saving, setup, migration, preferences) live in a dedicated group.
- **Strictly non-technical.** The scope line is *user-observability*: anything a user can see
  or run into belongs (including "your shop is stored in your Drive or a local folder" and
  "local folders require Chrome"); anything only a developer can observe — libraries, storage
  formats, column names, module names — is banned. A future agent must be able to rebuild the
  product's behaviour from these specs in any technology.
- **Cross-page rules live in their owning page.** A rule that appears on several pages (job
  totals, archive cascades, save semantics) is written once, in the page that primarily
  exercises it, and referenced by path from the others. There is no separate domain-rules
  area.

## Consequences

- A behaviour change maps to exactly one spec file, which is the unit of the D3 sync duty.
- Specs survive rewrites: nothing in them binds to the current stack, so only genuine product
  changes require edits.
- Owning pages accumulate reference weight (the job-details widgets file becomes the de-facto
  home of the money rules); readers arriving via references must follow one hop.
- The feature-focused `specs/features/` convention from the ai-framework is intentionally not
  used for this project; `specs/features/README.md` should point here once the tree lands.

## Pending before acceptance

- The writing voice inside files (descriptive prose vs requirement/scenario vs hybrid).
- The name of the non-page group (`shell/` or otherwise) and the full ownership map.
- Spec language (English assumed) and the disposition of the retired `openspec/` tree.
