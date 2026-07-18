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
as siblings of — but separate from — the decision records in `specs/ADRs/`.

- **Page-focused tree.**
  Folders mirror the app's navigation (`jobs/`, `clients/`, `dashboard/`, ...),
  with one file per page region,
  e.g. `specs/jobs/details/widgets.spec.md`.
- **Global behaviour lives in loose root files, not a group folder.**
  Behaviour that belongs to no page —
  navigation, search, the profile menu, not-found —
  is a meaningfully named file directly under `specs/`,
  taking a folder of its own when it warrants one
  (`saving/`, `migration/`).
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
- **Page-agnostic mechanics live in `specs/shared/`.**
  A section, control or behaviour that several pages place
  without owning —
  notes, tags, tables, lists, the dropdown,
  the details-page lifecycle —
  is one file under `shared/`, linked from every page that shows it,
  so no page accidentally becomes its home.
  A rule that one page genuinely exercises stays owned by that page
  (job money in the job's widgets, consumption in the pieces table)
  and is referenced from the others with ordinary Markdown links.
- **Shared files are base templates; page files are specialisations.**
  A `shared/` mechanic is written as the default spec,
  naming its blanks and never naming entities;
  a page file opens with the formula —
  lives at, follows, title, its columns and departures —
  and fills exactly those blanks
  (`shared/list.spec.md` behind every list page,
  `shared/details.spec.md` behind every details page and its widgets).
- **Every file opens by placing itself.**
  A spec's first lines say what it is and where it lives:
  a page — "A page at `#/inventory/{id}`" — with its address,
  or a section — `A section of [a material's page](…)` —
  with its parent linked.
  The main file of a details folder is always `details.spec.md`.
- **Hybrid voice, with one house rule.**
  Prose and tables carry everything linear.
  The moment behaviour branches —
  a gate, a dialog, a cascade, a fallback —
  it must leave the prose and become a `Scenarios` bullet
  (*condition → outcome*).
- **Meaningful copy is quoted; incidental labels are not.**
  Text that carries a promise, a warning or an explanation
  appears in the spec verbatim;
  button captions and other trivial labels stay out.
- **Technical artefacts may be linked, never described.**
  Where a behaviour is anchored by a source of truth in the repository —
  the version constant, the schema diagram —
  the spec may link to it as a reference for maintainers.
  The prose around the link stays user-observable.
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
  `FRAMEWORK.local.md` carries the override.

## Open points, tracked through the migration

- The disposition of the retired `openspec/` tree —
  and pointing the OpenSpec workflow skills at this layout —
  is decided once the migration proves the format.
  Until then `openspec/specs/` remains the frozen v2 record.
