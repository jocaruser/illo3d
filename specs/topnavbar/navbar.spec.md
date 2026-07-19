# Navbar

The app's chrome: what is always on screen once a shop is open,
and how the user moves between pages.

## The header

From left to right:

- **The shop's mark** — the shop's own logo when its folder provides one,
  the app's otherwise — and the wordmark "illo3d".
  Pressing either goes home (the dashboard).
  The browser tab's icon follows the same logo.
- **The section links** — Dashboard, Clients, Jobs, Transactions,
  Inventory, Audit Log.
- **Refresh and Save** — the workbook controls
  (their meaning is [saving](../saving/saving.spec.md)'s).
- **Search** — the global search, below.
- **The profile avatar** — opening [the profile menu](profile.spec.md).

The current section's link is visibly active,
and stays active on that section's details pages:
a job's page keeps **Jobs** lit.
Only the address decides this —
searching or opening menus never changes it.

On a narrow screen the section links fold behind a menu button,
and Refresh and Save move to their own row.
None of it disappears; it only rearranges.

## Search

One box, [rendering results as every search does](../shared/search.spec.md),
promising exactly what it says: **"Search everything…"** —
clients, jobs, pieces, notes, transactions, materials and tags,
all at once, as you type.
It reads what is currently loaded
(including unsaved edits — see [saving](../saving/saving.spec.md));
archived and deleted things do not appear.
Up to ten results at a time;
searching an id (like "J4") puts that exact thing first.
No matches: "No matches".

Scenarios — choosing a result:

- Pressing one, or Enter on it highlighted,
  → goes to that thing:
  clients, jobs and materials open their own pages;
  a piece opens its job, scrolled to the piece;
  a note opens whatever it is written on.
- Enter with nothing highlighted → the first result.

Under the header: [breadcrumbs](breadcrumbs.spec.md).
