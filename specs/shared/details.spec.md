# The details page

The default spec for an entity's own page —
one thing, at its own address.
Specialisations link this file
and declare only what is their own:
their widgets, their sections, their oddities.

A details page usually lives at `#/{name}/{id}`,
reached from [its list](list.spec.md)
and from everywhere the entity is [linked](linking.spec.md).
An address that matches nothing —
including anything deleted —
is [not found](../not-found.spec.md).

What every one has:

- **Breadcrumbs**, as [breadcrumbs](../topnavbar/breadcrumbs.spec.md) says,
  and a back link to its list.
- **[Widgets](widgets.spec.md)** —
  every details page shows its entity's values as widgets.
  Which values, in what order and of what kind
  is declared in the specialisation's own widgets spec.
- **Its sections**, each specified in a file
  beside the page's own `details.spec.md`.
- **[Notes](notes.spec.md) and [tags](tags.spec.md)** —
  any entity may carry both;
  each page says whether it places the sections.
- **The [lifecycle](lifecycle.spec.md) actions** for its state.
- **No save buttons of its own** —
  editing changes the shop in memory;
  storing it is the header's one [Save](../saving/saving.spec.md).
