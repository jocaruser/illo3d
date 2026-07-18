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
as if it no longer existed
(each details page's spec links here for its own case).

The [header and menu](navigation.spec.md) stay in place around the card;
the user is lost, not stranded.
Being here changes nothing else:
no data is touched, and unsaved edits
([saving](saving.spec.md)) survive the detour.
