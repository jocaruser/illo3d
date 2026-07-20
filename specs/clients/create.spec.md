# Creating a client

The flow behind the clients list's "Add client" —
a [dialog](../shared/dialogs.spec.md), "Add client".

| Field | Notes |
|---|---|
| Name | Required — "Client or company name" |
| Email | Optional |
| Phone | Optional |
| Preferred contact | Optional |
| Lead source | Optional; mentions in it become links ([notes](../shared/notes.spec.md#mentions)) |
| Address | Optional, multiline |
| Notes | Optional, multiline — the record's own note |

An empty name is refused in place: "Name is required".

Creating lands on the new client's page.
**Edit** is the same dialog, prefilled —
reached from the list's Actions column or the client's page.
