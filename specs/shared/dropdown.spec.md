# The dropdown

The default spec for the app's one dropdown —
wherever one value is picked from a set:
in dialogs, in widgets, in filters, inline in rows.
Closed, it looks like every form control;
open, it shows the set as a list below itself.

Three modes, declared per use:

- **Plain** — pressing it opens the full set.
  Usually for short, fixed sets.
- **Searchable** — typing filters the set live,
  matching as every search does
  ([ADR-0017](../decisions/ADR-0017-fuzzy-matching-in-every-search.md)).
  Usually for open sets.
  Nothing matching says "No matching items", quietly, in the list.
- **Creatable** — searchable, plus:
  a name typed that is not in the set
  offers **Create "‹name›"** as the list's last row;
  picking it creates the thing and selects it.

Whatever the mode, one behaviour:

- ↑ and ↓ move the highlight, wrapping at the ends.
- Enter picks the highlighted option;
  Escape closes, changing nothing.
- Clicking an option picks it; clicking away closes.
- An empty set says "No items available"
  instead of showing an empty list.
- A disabled dropdown opens nothing.

Every use of this spec answers, specifically:

- Its mode — plain, searchable, or creatable.
- Its set — the fixed options,
  or where the open set comes from.
- What picking does —
  and, when creatable, what creating does.
