# Navigation

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
  (their meaning is [saving](saving.spec.md)'s).
- **Search** — [the global search box](search.spec.md).
- **The profile avatar** — opening [the profile menu](profile.spec.md).

The current section's link is visibly active,
and stays active on that section's details pages:
a job's page keeps **Jobs** lit.
Only the address decides this —
searching or opening menus never changes it.

On a narrow screen the section links fold behind a menu button,
and Refresh and Save move to their own row.
None of it disappears; it only rearranges.

## Breadcrumbs

Under the header, a trail places the user:
**Home → section → item**.
The item is named by what it is —
a job's description, a client's name, a material's name —
falling back to its id when it has no name.
Pages earlier in the trail are links; the last entry is where you are.

This rule is written once, here.
Every page spec that shows breadcrumbs links to this section
rather than restating it.

## Dead ends

Addresses that lead nowhere show the [not-found card](not-found.spec.md),
inside the normal chrome.
Two addresses from older versions redirect instead:
`#/login` goes home, and `#/expenses` opens the transactions.
