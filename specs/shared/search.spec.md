# Search results

The default spec for a search that returns a list of results
to navigate to, rather than filtering a visible table
([that is the search box's](search-box.spec.md)).

Nothing happens until the query is two characters long;
from there, every keystroke refreshes the list live.
Matching follows
[ADR-0017](../ADRs/ADR-0017-fuzzy-matching-in-every-search.md):
fuzzy, anywhere, ids and dates as fragments.

Each result renders as two lines —
what kind of thing it is, then its name with its context —
in a list that behaves as [the dropdown](dropdown.spec.md)'s:
arrows move the highlight, Enter picks it
(or the first result, with nothing highlighted),
Escape closes and clears the query.

Every use of this spec answers, specifically:
what it searches, what each result opens,
and its own no-matches wording.
