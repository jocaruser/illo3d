# ADR-0017: Every search matches fuzzily, with one shared matcher

- Status: Accepted
- Date: 2026-07-18

## Context

The app searches in several places —
list-page search fields,
the global search, the tag box, and combobox option filtering.
Left alone, each grows its own matching,
and the same query behaves differently per page.

## Decision

Every search in the app uses one matching rule, implemented once:

- **Fuzzy**: small typos are forgiven.
- **Anywhere**: any part of the searched text can match —
  ids and dates count as fragments ("2026-06").
- **Everywhere the same**: a query that finds a row in one place
  finds it in every other place that searches the same rows.

## Consequences

- Search boxes and combobox filters are interchangeable in behaviour —
  see `openspec/specs/global-search/spec.md` for global search,
  and new surfaces inherit the matcher for free.
- The matcher's tolerance is product behaviour:
  tuning it changes every search at once, deliberately.
