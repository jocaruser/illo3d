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
  The only kind whose value can be a link
  ([linking](linking.spec.md)).
- **Number** — just a number: a quantity, with its unit.
- **Money** — an amount:
  green at zero or above, red below.
- **Date** — a moment, or a deadline.
  Marked editable, it opens the browser's
  built-in calendar picker.
- **Choice** — one value picked from a set:
  a dropdown, a colour.
  Marked editable, it opens its picker in place.

Any widget may be read-only or edit in place;
an edit changes the shop in memory,
stored by the header's one [Save](../saving.spec.md).

The specialisation's own widgets spec declares
the order, the kind of each,
which edit in place,
and anything else a widget carries —
a colour band on a date, an action on a card.
