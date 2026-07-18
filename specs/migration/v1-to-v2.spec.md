# Upgrade: v1 → v2

What a version-1 shop gains when the
[migration wizard](wizard.spec.md) brings it to version 2.

## The audit log begins

Version 2 introduces the permanent record of every change —
who did what, and when
(see the audit log page once the shop is open).

The upgrade creates that record and **backfills** it:
every item already in the shop —
every client, job, piece, material, transaction and so on —
gets a baseline entry marking it as present at migration time,
recorded by "migration" rather than by a person.
History effectively starts at the upgrade,
with the pre-existing world captured as its first page.

## Archive and delete tracking

Version 1 could only remove things outright.
Version 2 adds lifecycle tracking to every kind of item,
which is what lets the app archive things —
and soft-delete archived things —
without losing their history.

## What the wizard says

In the [wizard's](wizard.spec.md) explanation,
this hop contributes two bullets:
**"Audit logging"** —
"a permanent record of every change,
so you can see who did what and when" —
and **"Archive & delete tracking"** —
"keep your workspace clean without losing history".

## What the user sees during the run

One card per kind of item
(Clients, Notes, Tags, Tag Links, Jobs, Pieces, Piece Items,
Inventory, Lots, Transactions),
each "Adding the new columns",
then an **Audit Log** card
"Creating the audit log sheet"
and "Backfilling baseline audit entries".

Nothing is removed or altered —
existing data is only extended.
