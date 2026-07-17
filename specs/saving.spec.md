# Saving

The single most important contract in the app:
**nothing you do is stored until you press Save.**
Creating, editing, archiving —
every change lives only in the app's memory,
and the shop's files change only at the moment of saving.
(The [migration wizard](migration/wizard.spec.md) follows the same
philosophy with its own submit.)

## Knowing where you stand

- With no unsaved changes, **Save** is disabled — there is nothing to save.
- The first change enables it, and it stays enabled until a successful save.
- Leaving the app with unsaved changes —
  closing the tab, refreshing, navigating away —
  makes the browser ask whether you mean it.

## Reviewing before saving

Pressing **Save** writes nothing yet.
It opens **"Save changes"** — a review of what saving will do —
with "Review changes before submitting."
and a count of how many sheets hold unsaved changes.

The review shows one card per sheet of the shop
(Clients, Jobs, Audit Log, …) —
the same cards, in the same visual language,
as the [migration wizard](migration/wizard.spec.md)'s steps.
Each card tells the sheet's state at a glance:

- a **changed** sheet says how much changed ("‹n› rows changed";
  the audit log counts "‹n› new entries");
- a **clean** sheet shows a tick — nothing of it will change.

Selecting a card shows that sheet's changes beside the cards
(on a narrow screen the cards become a scrollable strip
above the detail):
the changed rows for a changed sheet,
"No changes" for a clean one,
and for the audit log, the entries about to be appended.

## The diff

Each changed row is shown like a diff:
field by field, the old value in red, the new value in green.
The row's own audit entries carry the diff —
what the review shows is exactly what the
[audit log](decisions/ADR-0005-audit-logging-at-repository-layer.md)
recorded.

- Fields that did not change are hidden;
  **"Show unchanged fields"** reveals the whole row.
- The changed row links to its page,
  and a field that points at another entity
  (the client of a job, the tag of a tag link, …)
  links to that entity the way it is linked everywhere else.
- On an edited row, every changed field offers **Revert**:
  the field returns to its stored value
  and drops out of the diff.
  A revert is an ordinary, audit-logged edit —
  the history keeps both the change and its undoing.

Two actions close the review:

- **Save all** — the only way anything is written (below).
- **Discard all** — the same as [Refreshing](#refreshing):
  after "Discard unsaved changes?" is confirmed,
  storage is re-read and every local edit is gone.

Leaving the review any other way changes nothing:
your edits are still there, still unsaved.

## Saving

**Save all** writes the whole shop, all at once.
The review stays up and becomes the progress:
each card moves changed → saving → saved
as its sheet is written,
until every card is saved.

Scenarios:

- The save completes
  → "Workbook saved." confirms it,
  the review closes, and Save disables again.
- The save fails partway
  → the run halts on a red card,
  "Could not save workbook." offers **Retry**,
  and your changes are still there, still unsaved.
- On Google Drive, access has expired mid-save
  → the app asks you to sign in again, then Retry works.

## Refreshing

**Refresh** re-reads the shop from storage,
replacing everything in memory.

Scenarios:

- No unsaved changes → the shop reloads quietly.
- Unsaved changes → a confirmation first:
  **"Discard unsaved changes?"** —
  "Your local edits will be lost. Reload data from storage?"
  Confirming ("Discard and refresh") reloads and the edits are gone;
  cancelling changes nothing.

## Two places at once

The same shop can be open in two tabs, or on two devices.
The app does not notice:
**the last save wins, silently**,
overwriting whatever was saved before it
([ADR-0013](decisions/ADR-0013-last-save-wins.md)).
One person, one place at a time is the intended way to work.
