# The widgets

The default spec for a details page's widgets —
the small cards across the top of the page
that show the entity's values.
Each widget is a label and a value,
in a grid that reflows with the screen:
side by side where there is room,
stacking as it narrows.

Five kinds of widget:

- **Text** — words: a name, an id, a description.
- **Number** — a quantity, with its unit.
- **Money** — an amount.
- **Date** — a moment, or a deadline.
- **Choice** — one value picked from a set:
  a dropdown, a colour.

Any widget may be read-only or edit in place;
an edit changes the shop in memory,
stored by the header's one [Save](../saving.spec.md).
A value may link to another page
([linking](linking.spec.md)).

The specialisation's own widgets spec declares
the order, the kind of each,
which edit in place,
and anything else a widget carries —
a colour band on a date, an action on a card.
