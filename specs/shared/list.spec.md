# The list page

The default spec for a listing page —
the page that renders the full list of one kind of thing.
Specialisations link this file and fill in the blanks:
the title, the columns, and any departures.

A list page usually lives at `#/{name}`.

Above the table, one header row:

- The page **title** — the name of what is listed.
- The **search box** —
  filters the rows from the second character typed,
  forgiving small typos,
  matching anything about the row,
  including its id and dates as fragments ("2026-06").
- An **Add button**, when the specialisation names one —
  "Add ‹thing›", opening the entity's own `create.spec.md` flow.

Below it, the table, rendered [as every table is](table.spec.md):

- The specialisation declares the data columns.
- Every data column sorts on click,
  ascending then descending,
  ties broken by id so order never jitters.
- The final column is **Actions** — Edit and Archive —
  unless the specialisation says otherwise.
