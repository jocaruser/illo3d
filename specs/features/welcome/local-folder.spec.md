# Local folder

Choosing **Local folder** on the welcome screen stores the shop as plain files in a
folder you pick on your own computer.
The folder's contents decide what happens next —
there is no create-or-open question to answer.

Local folders need a Chromium-based browser (for example Chrome or Edge);
other browsers are told so and nothing else happens.

## Picking the folder

Pressing the door opens the system folder picker
while the screen shows "Opening folder picker…".
Dismissing the picker is treated as changing your mind:
back to the welcome screen, silently.

## What the folder's contents decide

- The folder holds a readable shop of the app's current version
  → the shop opens, and the dashboard loads.
- The folder holds a shop from an older version of the app
  → the migration wizard appears before the shop can open.
- The folder holds no shop —
  or nothing the app can recognise as one —
  → the app offers to start fresh with overwrite confirmation.
- The folder holds a recognisable shop with a broken layout
  → the shop does not open, and the message names what is wrong.

## Scenarios — after the folder is chosen

- The shop is valid but its data cannot be loaded
  → an error appears with a retry;
  the app is not entered half-loaded.
- Reopening the app later in the same browser
  → the same folder reopens without picking it again.
- When the browser no longer grants read/write access to that folder
  → a blocking in-app re-allow prompt appears before the dashboard is usable,
  with actions to grant access again or return to the welcome screen.
- Granting access again from that prompt
  → the shop loads from the same folder without opening the system folder picker.
- Declining re-allow
  → the welcome screen returns with no active shop and no persisted folder handle
  that would retry a failed reopen on the next visit.
- When folder access is still granted on reopen
  → the shop opens with no extra prompt (unchanged happy path).
- Signing out, or cancelling at any point
  → back to the welcome screen with nothing remembered.
