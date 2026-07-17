# Google Drive

Choosing **Google Drive** on the [welcome screen](welcome.spec.md)
keeps the shop in a spreadsheet in your own Google account.
The door starts Google sign-in immediately;
once signed in, a second screen — **"Connect your shop"** —
offers creating or opening.

## Signing in

Sign-in happens in a Google window.

Scenarios:

- Sign-in completes → the "Connect your shop" screen appears,
  showing who is signed in (name and picture).
- Sign-in fails or is abandoned
  → back to the welcome screen with
  "Sign-in did not complete. Please try again."
- The browser blocks the sign-in window
  → "Could not open the sign-in window.
  Allow pop-ups for this site and try again."

## Connect your shop

Two actions, side by side:

- **Create new shop** — makes a new shop folder named "illo3d" in your Drive,
  with a fresh spreadsheet inside, and opens it
  (the button reads "Creating your shop…" while it works).
- **Open existing shop** — present but disabled, with the promise:
  "Folder browsing is coming soon.
  Use the folder ID field below for now."

Below them, the working path for opening:
**"Or paste folder ID"**, with the guidance
"Find the ID in the folder URL: drive.google.com/drive/folders/ID_HERE".
Opening validates the folder exactly like a
[local one](local-folder.spec.md#what-the-folders-contents-decide):
a current shop opens,
an older shop goes through the [migration wizard](../migration/wizard.spec.md),
anything else explains what is wrong —
"This folder is not an illo3d shop."
when there is no shop to find.
Submitting an empty ID just asks for one.

A note on the screen sets expectations about access:
"This app only sees Google Drive files and folders you open here.
To use this shop on another device,
save the folder ID from the URL."

## Scenarios — leaving

- Cancel on this screen
  → signs out entirely and returns to the welcome screen
  ([the reset contract](welcome.spec.md)).
- Reopening the app later in the same browser
  → the shop reopens and Google access renews silently;
  only when that renewal fails does the app ask you to sign in again.
