# Local folder

Choosing **Local folder** on the [welcome screen](welcome.spec.md)
stores the shop as plain files in a folder you pick on your own computer.
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
  → the [migration wizard](../migration/wizard.spec.md) appears
  before the shop can open.
- The folder holds no shop —
  or nothing the app can recognise as one —
  → the app offers to start fresh:
  **"Create a new illo3d shop in "‹folder name›"?
  Existing shop files will be overwritten."**
  - Confirming creates a brand-new, empty shop in that folder.
    Only the shop's own files are written;
    anything else already in the folder is left untouched.
  - Cancelling returns to the welcome screen.
- The folder holds a recognisable shop with a broken layout
  → the shop does not open, and the message names what is wrong:
  "This shop's files do not match the layout this app expects: ‹detail›".

## Scenarios — after the folder is chosen

- The shop is valid but its data cannot be loaded
  (for example the files became unreadable mid-open)
  → an error appears with a retry;
  the app is not entered half-loaded.
- Reopening the app later in the same browser
  → the same folder reopens without picking it again;
  the browser may first ask you to re-allow access to it.
- Signing out, or cancelling at any point
  → back to the welcome screen with nothing remembered
  ([the reset contract](welcome.spec.md)).
