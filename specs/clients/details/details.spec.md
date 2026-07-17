# A client's page

Everything about one client:

- **Who they are** — the recorded fields,
  shown only when filled:
  id, email, phone, preferred contact,
  lead source (mentions in it become links —
  [notes](notes.spec.md#mentions)),
  address, created date,
  and the free-text note from the client record.
- [The metrics](metrics.spec.md) — their money story in five figures.
- [Tags](tags.spec.md) and [notes](notes.spec.md) —
  these two files own the mechanics
  that jobs' identical sections reuse.
- [The activity timeline](timeline.spec.md).
- [Their jobs](jobs-table.spec.md), with "Add job"
  creating one already assigned to them.

A back link returns to [the list](../list.spec.md);
breadcrumbs name the client
([navigation](../../navigation.spec.md)).

Lifecycle behaves exactly as
[a job's page](../../jobs/details/details.spec.md#lifecycle-on-this-page) —
active offers Edit and Archive,
archived is read-only with Un-archive and Soft delete,
soft-deleted addresses are [not found](../../not-found.spec.md).
