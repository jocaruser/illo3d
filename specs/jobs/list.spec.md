# Jobs

The listing page for the shop's jobs, newest first.
It lives at `#/jobs`
and follows [the list page](../shared/list.spec.md);
its title is "Jobs",
its Add button **"Add job"** — [the create flow](create.spec.md).

| Column | Viewport | Notes |
|---|---|---|
| ID | Always | Opens the job; hovering shows its tags |
| Description | Always | Also shows the tags on hover |
| Client | Medium+ | Opens the client |
| Status | Always | [The dropdown](../shared/dropdown.spec.md), with [the widgets'](details/widgets.spec.md#scenarios--changing-status) gates |
| Total | Wide+ | Derived, or "Incomplete pricing" ([pricing](../shared/pricing.spec.md)) |
| Due date | Wide+ | The lateness badge ([the scale](details/widgets.spec.md#due-date)) |
| Created | Wide+ | |
| Actions | Always | Edit ([the same dialog](create.spec.md), prefilled) and Archive |

Deleted jobs do not exist; archived ones render
[as every table shows them](../shared/table.spec.md).
The quiet empty row: "No jobs yet."

**Archive** asks first;
confirming archives the job and everything it owns —
pieces, material lines, notes, tag links
([ADR-0014](../ADRs/ADR-0014-archive-then-delete-lifecycle.md)).
