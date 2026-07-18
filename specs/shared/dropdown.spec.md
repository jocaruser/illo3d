# The dropdown

The default spec for the app's one dropdown —
wherever a value is picked from a set.
Closed, it looks like every form control;
open, it shows the set as a list below itself.

Two modes:

- **Searchable** — the default.
  Typing filters the set live,
  matching as every search does
  ([ADR-0017](../decisions/ADR-0017-fuzzy-matching-in-every-search.md)).
  Nothing matching says "No matching items", quietly, in the list.
- **Creatable** — searchable, plus one thing:
  a name typed that is not in the set
  offers **Create "‹name›"** as the list's last row;
  picking it creates the thing and selects it.

And one parameter:

- **Multiselect** — picking adds instead of replacing:
  the list stays open,
  picked values are marked in it,
  and each shows on the control, removable in place.

An option's text can be more than a name:
a set of entities shows "‹id› — ‹name›",
and the search matches any part of it.

Whatever the mode:

- ↑ and ↓ move the highlight, wrapping at the ends.
- Enter picks the highlighted option;
  Escape closes, changing nothing.
- Clicking an option picks it —
  and closes the dropdown,
  unless it multiselects, where it stays open for more.
  Clicking away always closes.
- An empty set says "No items available"
  instead of showing an empty list.
- A disabled dropdown opens nothing.

Every use of this spec answers, specifically:

- Its label — what the control calls itself.
- Its mode — searchable or creatable —
  and whether it multiselects.
- Its set — the fixed options,
  or where the open set comes from.
- What picking does —
  and, when creatable, what creating does.
