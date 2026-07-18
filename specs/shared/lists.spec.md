# How lists behave

One rule for every list page in the app —
jobs, clients, inventory, transactions, and the embedded tables
that say they follow it:

- One search box filters the rows from the second character typed,
  forgiving small typos,
  matching anything about the row —
  including its id and dates as fragments ("2026-06").
  No matches shows a saying-so row, never a blank table.
- Every data column sorts on click, ascending then descending,
  ties broken by id so order never jitters.
- Narrow screens hide the less essential columns;
  what identifies the row and its actions always remain.
