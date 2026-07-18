# Saving

The single most important contract in the app:
**nothing you do is stored until you press Save.**
Creating, editing, archiving —
every change lives only in the app's memory,
and the shop's files change only at the moment of saving.
(The [migration wizard](../migration/wizard.spec.md)
follows the same philosophy with its own submit.)

## Knowing where you stand

- With no unsaved changes, **Save** is disabled — there is nothing to save.
- The first change enables it, and it stays enabled until a successful save.
- Leaving the app with unsaved changes —
  closing the tab, refreshing, navigating away —
  makes the browser ask whether you mean it.

## Saving

Pressing **Save** writes the whole shop, all at once.
While it writes, a full-screen overlay blocks everything:
"Saving workbook", naming each part as it goes
("Saving ‹part›…", "‹current› of ‹total›").

Scenarios:

- The save completes
  → the overlay clears, "Workbook saved." confirms it,
  and Save disables again.
- The save fails partway
  → the overlay clears,
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
([ADR-0013](../decisions/ADR-0013-last-save-wins.md)).
One person, one place at a time is the intended way to work.
