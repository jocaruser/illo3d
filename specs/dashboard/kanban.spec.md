# Dashboard — the jobs board

> **Parked for a full respec** — the board will show pieces,
> not jobs ([the tracker](../README.md) holds the ruling).
> Below is today's behaviour, unchanged until that respec.

A section of [the dashboard](dashboard.spec.md).
Five columns — Draft, In progress, Delivered, Paid, Cancelled —
one card per job that is not archived or deleted.
An empty column says "No jobs".

## A card

Each card shows the job's description and its client,
and as much of its money story as is known:
the job's total when every piece is priced
(the rules are [pricing](../shared/pricing.spec.md)'s),
with the expected benefit in brackets after it;
an *incomplete* marker instead, when pricing is missing.
Below, the making progress — "‹done›/‹total› pieces done" —
and a lateness badge coloured on
[the due-date scale](../jobs/details/widgets.spec.md#due-date).
Pressing a card opens the job.

## Moving cards

Cards drag between and within columns;
within a column, the drop position is kept as the ordering.
Each card also carries a "Move to column" control for keyboards.

Moving is changing the job's status,
so it obeys the job's own gates —
moving into Paid or Cancelled, or out of Paid,
asks [the same questions the job page would](../jobs/details/widgets.spec.md#scenarios--changing-status).
A refused move leaves the card where it was.

## Cards that retire themselves

Paid and Cancelled cards are for recent history, not archaeology:
once such a job is past its due date by more than a few days
(five, unless [the shop's metadata](../entities/metadata.spec.md)
tunes it), its card quietly leaves the board.
The job itself is untouched — it simply stops occupying the present.
