# Dashboard — the calendar

A section of [the dashboard](dashboard.spec.md):
the open work placed on due dates, a month at a time —
a grid of weeks on a wide screen, a list of days on a narrow one.
Controls: previous and next month,
each captioned with its load — "Next month (3 jobs)" —
and "Today". Today's square is highlighted.
An empty month renders the same bare grid, no message.

Each job neither archived nor deleted sits on its due date
(no due date → its creation date,
[the widgets' fallback](../jobs/details/widgets.spec.md#due-date)),
as a chip — "‹description› (‹pieces›)", with its client —
coloured on [the due-date scale](../jobs/details/widgets.spec.md#due-date).
Pressing a chip opens the job.
