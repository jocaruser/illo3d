# Not found

The not-found card tells the user an address leads nowhere,
adapting its message and its way out to what was missed:

| Missing | Message | Way out |
|---|---|---|
| Any unknown address | "This page does not exist." | "Back to dashboard" |
| A job | "Job not found." | "Back to jobs" |
| A client | "Client not found." | "Back to clients" |
| A material | "No inventory item with this id." | "Back to inventory" |
| An expense | "This transaction could not be found or is not an expense." | "Back to transactions" |

Something soft-deleted counts as missing —
a deleted job's or client's own page renders not-found,
as if it no longer existed:
[ADR-0014](decisions/ADR-0014-archive-then-delete-lifecycle.md#delete-means-it-never-happened)
keeps a deleted record from ever reaching the app again,
so no page, total, search or link can meet one
(each details page's spec links here for its own case).

Two addresses from older versions redirect instead:
`#/login` goes home, and `#/expenses` opens the transactions.

The [header and menu](topnavbar/navbar.spec.md) stay in place around the card;
the user is lost, not stranded.
Being here changes nothing else:
no data is touched, and unsaved edits
([saving](saving.spec.md)) survive the detour.
