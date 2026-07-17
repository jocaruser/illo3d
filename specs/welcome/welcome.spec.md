# Welcome

The welcome screen is the app's front door.
It appears whenever no shop is open,
and its whole job is one question:
**"Where do you want to store your shop?"**

## When it appears — and when it doesn't

You see the welcome screen on a first visit,
after signing out,
and after cancelling or abandoning any setup flow.

Returning users skip it:
opening the app again in the same browser
lands straight back in the open shop,
with no welcome screen in between.

## Language and theme

Two small switches sit at the top of the screen,
usable before any shop exists:

- **Language** — EN / ES.
  On a first visit the app speaks the browser's language
  (Spanish for Spanish-locale browsers, English otherwise).
  Choosing here is remembered,
  and it is the same choice the profile menu edits later.
- **Theme** — light / dark.
  Also remembered, also shared with the profile menu.

## The two doors

Two cards, each naming a storage choice and its promise.
Pressing a card acts immediately —
the door itself asks no questions first.

| Door | Promise (shown on the card) | Pressing it |
|---|---|---|
| Local folder | "Files stay on your computer. Works offline. Chrome required." | Opens the folder picker — see [local folder](local-folder.spec.md) |
| Google Drive | "Synced to your Google account. Access from any device." | Starts Google sign-in — see [Google Drive](google-drive.spec.md) |

Below the doors, a hint for a quirk of the sign-in window:
"If sign-in did not continue automatically,
click Google Drive again to open the Google sign-in window."

## Scenarios — leaving before finishing

- Cancelling anywhere in either flow —
  including dismissing the folder picker or the sign-in window —
  → back to a clean welcome screen:
  identity, storage choice and any half-open shop are all discarded.
  There are no partial states to resume.
- While a chosen flow is working
  → both doors are disabled until it finishes or fails.
- On a browser without local-folder support
  → pressing **Local folder** says so
  ([local folder](local-folder.spec.md) owns the message).
