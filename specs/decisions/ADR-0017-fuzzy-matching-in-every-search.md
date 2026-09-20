# ADR-0017: Every search matches fuzzily, with one shared matcher

- Status: Accepted
- Date: 2026-07-18

## Context

The app searches in several places —
the [search box](../shared/search-box.spec.md) on list pages,
the global search, the tag box.
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

- Search boxes are interchangeable —
  [one spec](../shared/search-box.spec.md) covers them all,
  and new surfaces inherit the behaviour for free.
- The matcher's tolerance is product behaviour:
  tuning it changes every search at once, deliberately.
