# The table

The default spec for every table in the app —
list pages and embedded sections alike.
Whatever the data holds:

- The header row always renders.
  When there are no rows,
  one quiet row spans the table and says so —
  never a missing table, never a bare gap.
- Every data column sorts on click,
  ascending then descending,
  ties broken by id so order never jitters.
- Archived entities' rows render struck through and read-only,
  Un-archive their one action
  ([lifecycle](lifecycle.spec.md)).
  Deleted entities have no rows anywhere
  ([ADR-0014](../ADRs/ADR-0014-archive-then-delete-lifecycle.md)).

Every use of this spec answers, specifically:

- Which columns, in what order.
- Which columns each viewport keeps —
  a Viewport column in the same columns table,
  in four words: **Always**, or **Small+**, **Medium+**, **Wide+**
  (the app's three break widths, narrow phones upwards);
  what identifies the row always remains.
- The quiet empty row's wording, quoted verbatim.
