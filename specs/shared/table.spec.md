# How tables render

Every table in the app — list pages and embedded sections alike —
keeps its shape whatever the data holds:

- The header row always renders.
  When there are no rows,
  one quiet row spans the table and says so —
  each table names its own wording ("No purchase lots yet.") —
  never a missing table, never a bare gap.
- Archived entities' rows render struck through and read-only,
  Un-archive their one action
  ([lifecycle](lifecycle.spec.md)).
  Deleted entities have no rows anywhere
  ([ADR-0014](../decisions/ADR-0014-archive-then-delete-lifecycle.md)).
- Narrow screens hide the less essential columns;
  what identifies the row, and its actions, always remain.
