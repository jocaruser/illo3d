# Linking — what resolves to what

One rule for every place that shows an entity
away from its own page:
audit entries, transaction descriptions, timelines,
[mentions](notes.spec.md#mentions), table cells.

| A reference to | Opens |
|---|---|
| A client | Its page, `#/clients/{id}` |
| A job | Its page, `#/jobs/{id}` |
| A piece | Its job's page, scrolled to the piece |
| A material | Its page, `#/inventory/{id}` |
| A purchase | Its page, `#/transactions/{id}` |
| An income transaction | The job that explains it |
| A tag, a note, a lot | Nothing — no page of their own; plain text |

- An archived thing still links:
  its page stays reachable, read-only.
- A deleted thing cannot be referenced at all —
  whatever pointed at it went with it
  ([ADR-0014](../decisions/ADR-0014-archive-then-delete-lifecycle.md)).
- An id that matches nothing renders as plain text, harmlessly.
