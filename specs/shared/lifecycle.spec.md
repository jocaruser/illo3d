# Lifecycle on a details page

How the three states of
[ADR-0014](../ADRs/ADR-0014-archive-then-delete-lifecycle.md)
look and act on the page of any entity that has one:

- An **active** entity is editable,
  and offers **Edit** and **Archive**.
  Archiving asks first, naming its cascade —
  each page quotes its own wording.
- An **archived** entity is frozen:
  read-only everywhere on the page, nothing editable,
  offering **Un-archive** and **Delete**.
  Deleting asks first, and says there is no way back.
- A **deleted** entity has no page:
  its address is [not found](../not-found.spec.md),
  like everything else about it.

Away from its page, an archived entity stays visible,
struck through wherever it would appear
([how tables show it](table.spec.md));
a deleted one appears nowhere at all.

## Children on a parent's page

A parent's embedded tables — a job's pieces, a client's jobs —
show their archived children struck through,
each with its own Un-archive;
deleted children are simply absent,
as is every trace of them
([ADR-0014](../ADRs/ADR-0014-archive-then-delete-lifecycle.md)).
