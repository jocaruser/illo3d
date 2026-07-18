# A client's jobs

A section of [a client's page](details.spec.md):
their jobs, embedded,
rendered as [tables render](../../shared/table.spec.md) —
archived ones struck through with their own Un-archive,
deleted ones nonexistent.
Its search box behaves
[as every search box does](../../shared/search-box.spec.md).

| Column | Viewport | Notes |
|---|---|---|
| ID | Always | Opens the job |
| Description | Always | |
| Status | Always | [The dropdown](../../shared/dropdown.spec.md), with [the widgets'](../../jobs/details/widgets.spec.md#scenarios--changing-status) gates |
| Due date | Medium+ | |
| Created | Wide+ | |
| Actions | Always | Edit and Archive; archived rows offer Un-archive instead |

**"Add job"** opens [the create flow](../../jobs/create.spec.md)
with the client already chosen —
the new job appears here, without leaving the page.
The quiet empty row: "No jobs for this client yet."
