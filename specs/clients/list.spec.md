# Clients

Every active client, with "Add client" to create one.
The table behaves as
[all lists do](../jobs/list.spec.md#how-lists-behave-all-of-them);
an empty shop has its saying-so row.

| Column | Notes |
|---|---|
| ID | Opens the client |
| Name | Hovering shows the client's tags — "Tags: ‹list›" |
| Email, Phone, Notes, Created | |
| Actions | Edit, Archive |

## Scenarios

- **Add client** → a dialog: name is required,
  everything else optional —
  email, phone, notes, preferred contact,
  lead source (which may mention things — see
  [notes](details/notes.spec.md#mentions) for how mentions work),
  and a multiline address.
  Creating lands on the new client's page.
- **Edit** → the same dialog, prefilled.
- **Archive** → asks first, naming the consequence:
  "Archive ‹name›? Linked jobs and their data will be archived."
  ([ADR-0014](../decisions/ADR-0014-archive-then-delete-lifecycle.md)).
