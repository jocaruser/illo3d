# Not found

The not-found card tells the user an address leads nowhere:
**"This page does not exist."**
with one way out — "Back to dashboard".
The [header and menu](navigation.spec.md) stay in place around it;
the user is lost, not stranded.

It appears for:

- any address that matches no page at all;
- the address of something soft-deleted —
  a deleted job's or client's own page renders not-found,
  as if it no longer existed
  (each details page's spec links here for its own case).

Being on the not-found card changes nothing else:
no data is touched, and unsaved edits
([saving](saving/saving.spec.md)) survive the detour.
