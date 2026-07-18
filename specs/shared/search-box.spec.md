# The search box

The default spec for a search box —
wherever one filters what a page shows.

It filters live, from the second character typed.
Matching follows
[ADR-0017](../decisions/ADR-0017-fuzzy-matching-in-every-search.md):
fuzzy, anywhere in the row,
ids and dates as fragments ("2026-06").

Clearing the box restores the full list.
No matches leaves the table's headers
and its [quiet saying-so row](table.spec.md).
