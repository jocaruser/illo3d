# What every details page has

The shell every entity's own page shares —
a client's, a job's, a material's, a purchase's.
Each page's spec declares only what is its own:
its fields, its sections, its oddities.

- **An address of its own** —
  `#/clients/{id}`, `#/jobs/{id}`,
  `#/inventory/{id}`, `#/transactions/{id}` —
  reached from its list
  and from everywhere the entity is [linked](linking.spec.md).
  An address that matches nothing —
  including anything deleted —
  is [not found](../not-found.spec.md).
- **Breadcrumbs**, as [navigation](../navigation.spec.md) says,
  and a back link to its list.
- **An identity header** —
  the recorded facts, shown only when filled.
- **Its sections**, each specified in a file
  beside the page's own `details.spec.md`.
- **[Notes](notes.spec.md) and [tags](tags.spec.md)** —
  any entity may carry both;
  each page says whether it places the sections.
- **The [lifecycle](lifecycle.spec.md) actions** for its state.
- **No save buttons of its own.**
  Editing changes the shop in memory;
  storing it is the header's one [Save](../saving.spec.md).
