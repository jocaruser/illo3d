# Notes

Notes are an entity's diary.
Clients and jobs place the section today,
and any entity may —
the data model already allows every kind
([schema.dbml](../../schema.dbml)).
This shared file owns the mechanics;
the pages only place the section.

A note is plain text with a **severity**,
added in place ("Plain text note"),
editable and deletable afterwards (deleting asks first).
Newest first.

## Severity

One of: info, danger, warning, success, primary, secondary —
a colour, and a promise:
any note graver than info or secondary
also surfaces as an alert strip at the top of its section,
so a "danger" note about a client
is seen before anything else about them.

## Mentions

Writing `@` and an id — `@CL1`, `@J4`, `@P2` —
links the note to that thing:
rendered as a link wherever the note appears
(a piece mention opens its job, scrolled to the piece).
An id that matches nothing → plain text, harmlessly.
The client's *lead source* field understands
the same mentions —
"Referred by @CL2" links to the referrer.
