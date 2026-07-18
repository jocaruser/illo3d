# Tags

Tags are shared labels —
one pool for the whole shop,
attachable to any entity
([schema.dbml](../../schema.dbml) already allows every kind);
clients and jobs place the section today.
This shared file owns the mechanics;
the pages only place the section.

The section shows the attached tags as chips,
each removable in place.
Adding is one box — "Type to search or create…" —
which searches the pool as you type.

Scenarios — submitting the box:

- An existing tag picked → attached.
- A name matching an existing tag, in any capitalisation,
  → that tag is reused — the pool never gains duplicates.
- A genuinely new name → the tag is created and attached.
- A tag the owner already has → quietly refused.

Tags follow their owner into list tooltips.
