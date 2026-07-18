# Dashboard — the jobs board

Five columns — Draft, In progress, Delivered, Paid, Cancelled —
one card per job that is not archived or deleted.
Each column's header counts its cards;
an empty column says "No jobs".

## A card

Each card shows the job's description and its client,
and as much of its money story as is known:
the job's total when every piece is priced
(the rules are
[the job's widgets'](../jobs/details/widgets.spec.md)),
or an *incomplete* marker when pricing is missing —
with the expected benefit in brackets after either,
whenever it is computable.
A job with at least one piece adds its making progress —
"‹done›/‹total› pieces done".
Last, a badge — "Due ‹date›" —
coloured on
[the due-date scale](../jobs/details/widgets.spec.md#due-date),
neutral while the job is not late.
Pressing the description opens the job;
the rest of the card is for dragging.

## Moving cards

Cards drag between and within columns;
within a column, the drop position is kept as the ordering.
Each card also carries a status control for keyboards,
labelled "Status for job ‹id›".

Moving is changing the job's status,
so it obeys the job's own gates —
moving into Paid or Cancelled, or out of Paid,
asks [the same questions the job page would](../jobs/details/widgets.spec.md#scenarios--changing-status).
A refused move leaves the card where it was.

## Cards that retire themselves

Paid and Cancelled cards are for recent history, not archaeology:
once such a job is past its due date by more than a few days
(five, unless [the shop's metadata](../entities/metadata.spec.md)
tunes it — a job with no due date measured from its creation date,
[the widgets' fallback](../jobs/details/widgets.spec.md#due-date)),
its card quietly leaves the board.
The job itself is untouched — it simply stops occupying the present.
