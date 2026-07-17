# Jobs

The jobs page lists every active job — newest first —
with "Add job" to create one.
Archived and deleted jobs are absent
([ADR-0014](../decisions/ADR-0014-archive-then-delete-lifecycle.md));
an empty shop says "No jobs yet."

## How lists behave (all of them)

This rule is written once, here,
for every list page in the app:

- One search box filters the rows from the second character typed,
  forgiving small typos,
  matching anything about the row —
  including its id and dates as fragments ("2026-06").
  No matches shows a saying-so row, never a blank table.
- Every data column sorts on click, ascending then descending,
  ties broken by id so order never jitters.
- Narrow screens hide the less essential columns;
  what identifies the row and its actions always remain.

## The columns

| Column | Notes |
|---|---|
| ID | Opens the job; hovering shows the job's tags |
| Description | Also shows the tags on hover |
| Client | Opens the client |
| Status | Editable in place — same gates and dialogs as [the job's status widget](details/widgets.spec.md) |
| Total | The derived total, or the "Incomplete pricing" badge ([widgets](details/widgets.spec.md) owns the rule) |
| Due date | The lateness badge ([widgets](details/widgets.spec.md) owns the colouring) |
| Created | |
| Actions | Edit, Archive |

## Scenarios

- **Add job** → a dialog asking the client (searchable),
  a description, and a due date —
  suggested from [the shop's default](../entities/metadata.spec.md)
  when one is set.
  Creating lands on the new job's page.
- **Edit** → the same dialog, prefilled.
- **Archive** → asks first;
  confirming archives the job *and everything it owns* —
  pieces, material lines, notes, tag links
  ([ADR-0014](../decisions/ADR-0014-archive-then-delete-lifecycle.md)).
