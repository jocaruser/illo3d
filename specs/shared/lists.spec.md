# How lists behave

One rule for every list page in the app —
jobs, clients, inventory, transactions —
and for the embedded tables that say they follow it.
Rendering — headers, emptiness, archived rows, narrow screens —
is [every table's](table.spec.md);
this file adds the behaviours:

- One search box filters the rows from the second character typed,
  forgiving small typos,
  matching anything about the row —
  including its id and dates as fragments ("2026-06").
  No matches leaves the headers and the quiet saying-so row
  ([tables](table.spec.md)).
- Every data column sorts on click, ascending then descending,
  ties broken by id so order never jitters.
