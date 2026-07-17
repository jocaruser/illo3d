# Dashboard — the calendar

The other way to see the open work: jobs placed on their due dates.

A month at a time —
a grid of weeks on a wide screen,
a list of days on a narrow one —
with controls for the previous month, "Today", and the next.
Today's square is highlighted.

Each job that is not archived or deleted appears on its due date
(a job with no due date sits on its creation date instead —
[the widgets' fallback](../jobs/details/widgets.spec.md#due-date)),
as a small chip with its description and client,
coloured by the same lateness scale as the
[board's badges](kanban.spec.md).
Pressing a chip opens the job.

A month with nothing due says so:
"No jobs due this month."
