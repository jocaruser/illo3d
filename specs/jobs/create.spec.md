# Creating a job

The flow behind the jobs list's "Add job" —
a [dialog](../shared/dialogs.spec.md), "Create job",
also offered by [the dashboard](../dashboard/dashboard.spec.md)
and, pre-assigned, by [a client's page](../clients/details/jobs-table.spec.md).

| Field | Notes |
|---|---|
| Client | Required. [A dropdown](../shared/dropdown.spec.md) over active clients — "Search clients…"; hidden when a client's page already chose it |
| Description | Required — "What are you printing?" |
| Due date | Optional; suggested ‹defaultDueDate› days out when [the shop's metadata](../entities/metadata.spec.md) sets one |

Missing answers are named in place:
"Select a client", "This field is required".

Creating from the list opens the new job's page;
from a client's page, the job simply appears in their table.
**Edit** is the same dialog, prefilled —
reached from the list's Actions column or the job's ID widget.
