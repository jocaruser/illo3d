# ADR-0008: Store behaviour specs as page-focused, non-technical files

- Status: Accepted
- Date: 2026-07-17

## Context

The v2 spec set (`openspec/specs/`, 46 capability-focused files)
drifted badly during the v3 rewrite:
it described removed libraries, storage columns and internal module names,
so by the time it was needed as a source of truth it was part lie.
The development standards commit this project to D3 —
specs kept in sync with actual behaviour —
which requires a format that is cheap to keep true
and survives implementation rewrites.

Two structural options were considered:
feature-focused files (the OpenSpec/ai-framework default)
and page-focused files, where the tree mirrors what a user navigates.
The maintainer thinks in pages,
and sync duties are easier to scope
when a change to a screen maps to exactly one file.

## Decision

Behaviour specs live at the repository root under `specs/`,
as siblings of — but separate from — the decision records in `specs/decisions/`.

- **Page-focused tree.**
  Folders mirror the app's navigation (`jobs/`, `clients/`, `dashboard/`, ...),
  with one file per page region,
  e.g. `specs/jobs/details/widgets.spec.md`.
- **Global behaviour lives in loose root files, not a group folder.**
  Behaviour that belongs to no page —
  theme, language, saving, setup, migration —
  is a meaningfully named file directly under `specs/`,
  e.g. `specs/theme.spec.md`.
- **The tree deepens as complexity grows.**
  When a file grows past comfortable reading,
  it becomes a folder of smaller files:
  `jobs/details/widgets.spec.md` → `jobs/details/widgets/totals.spec.md`, and so on.
  Splitting is always preferred over a long file.
- **Strictly non-technical.**
  The scope line is user-observability:
  anything a user can see or run into belongs
  (including "your shop is stored in your Drive or a local folder"
  and "local folders require Chrome");
  anything only a developer can observe —
  libraries, storage formats, column names, module names — is banned.
  A future agent must be able to rebuild the product's behaviour
  from these specs in any technology.
- **Cross-page rules live in their owning page.**
  A rule that appears on several pages
  (job totals, archive cascades, save semantics)
  is written once, in the page that primarily exercises it,
  and referenced from the others with ordinary Markdown links,
  e.g. `[job total](../jobs/details/widgets.spec.md)`.
- **Hybrid voice, with one house rule.**
  Prose and tables carry everything linear.
  The moment behaviour branches —
  a gate, a dialog, a cascade, a fallback —
  it must leave the prose and become a `Scenarios` bullet
  (*condition → outcome*).
- **Readability is the prime rule.**
  Specs are written to be read:
  short files, short paragraphs,
  semantic line breaks (ADR-0009),
  British English (ADR-0010).
  A spec that provokes skim-reading has failed
  regardless of its accuracy.

## Consequences

- A behaviour change maps to exactly one spec file,
  which is the unit of the D3 sync duty.
- Specs survive rewrites:
  nothing in them binds to the current stack,
  so only genuine product changes require edits.
- Owning pages accumulate reference weight
  (the job-details widgets file becomes the de-facto home of the money rules);
  readers arriving via links follow one hop.
- The feature-focused `specs/features/` convention from the ai-framework
  is intentionally not used for this project;
  `specs/features/README.md` should point here once the tree lands.

## Open points, tracked through the migration

- The ownership map for shared rules is settled incrementally:
  each page is planned and confirmed file by file,
  and owners are agreed as the pages that exercise them come up.
- The disposition of the retired `openspec/` tree —
  and pointing the OpenSpec workflow skills at this layout —
  is decided once the migration proves the format.
  Until then `openspec/specs/` remains the frozen v2 record.
