# The list page

The default spec for a listing page —
the page that renders the full list of one kind of thing.
Specialisations link this file and fill in the blanks:
the title, the columns, and any departures.

A list page usually lives at `#/{name}`,
with breadcrumbs as [breadcrumbs](../topnavbar/breadcrumbs.spec.md) says.

Above the table, one header row:

- The page **title** — the name of what is listed.
- The **search box**,
  [as every search box behaves](search-box.spec.md).
- An **Add button**, when the specialisation names one —
  "Add ‹thing›", opening the entity's own `create.spec.md` flow.

Below it, the table, rendered [as every table is](table.spec.md):

- The specialisation declares the data columns.
- A row usually opens its entity's own
  [details page](details.spec.md) —
  nothing enforced; the specialisation says how,
  commonly through its id column.
- The final column is **Actions** — Edit and Archive —
  unless the specialisation says otherwise.
