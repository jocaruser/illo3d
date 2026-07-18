# Clients

The listing page for the shop's clients.
It lives at `#/clients`
and follows [the list page](../shared/list.spec.md);
its title is "Clients",
its Add button **"Add client"** — [the create flow](create.spec.md).

| Column | Viewport | Notes |
|---|---|---|
| ID | Always | Opens the client |
| Name | Always | Hovering shows the client's tags — "Tags: ‹list›" |
| Email | Always | |
| Phone | Medium+ | |
| Notes | Always | The record's free-text note |
| Created | Wide+ | |
| Actions | Always | Edit ([the same dialog](create.spec.md), prefilled) and Archive |

Deleted clients do not exist; archived ones render
[as every table shows them](../shared/table.spec.md).
The quiet empty row: "No clients yet."

**Archive** asks first, naming the consequence:
"Archive ‹name›? Linked jobs and their data will be archived."
([ADR-0014](../ADRs/ADR-0014-archive-then-delete-lifecycle.md)).
