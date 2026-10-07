# Profile menu

The avatar at the right end of the [header](navbar.spec.md)
opens a small menu about *you and this shop*.
It closes on a click elsewhere or Escape.

Top to bottom:

- **Who you are.**
  With Google: your name, email and picture
  (a broken picture falls back to your initial).
  With a local shop: the name the shop's metadata gives you,
  or simply "Local user".
- **Where this shop lives.**
  With Google: a link, "Open Drive folder",
  opening the shop's folder in a new tab,
  with the folder's name beneath it.
  Locally: the folder's name.
- **Preferences.**
  The same language and theme (light/dark) choices
  as [the welcome screen](../welcome/welcome.spec.md) —
  one preference, editable from either place,
  though here the Spanish choice is spelt "Español"
  where the welcome toggle says "ES".
- **Versions.**
  One quiet line: "App ‹version› · Shop ‹version›" —
  the app you are running,
  and the version your shop's files are on.
  They drift apart with every minor and patch release
  and stay apart;
  only a major upgrade —
  [the migration wizard](../migration/wizard.spec.md) — closes the gap.
- Two placeholders that do nothing yet,
  visibly disabled: "Edit metadata.json" and "Changelog".
- **Sign out.**
  Closes the shop and returns to the
  [welcome screen](../welcome/welcome.spec.md);
  the rules are [below](#sign-out).

## Sign out

Choosing **Sign out** ends the session and returns the user to the welcome
experience through the same routing as today.

When a shop is open and the workbook has **unsaved changes**, sign-out asks
**"Discard unsaved changes?"** before clearing anything — the same prompt as
[Refresh](../saving.spec.md#refreshing).
Confirming discards local edits and completes sign-out; cancelling leaves the
user signed in with edits intact.

When there are no unsaved edits, sign-out completes in one action with no
dialog.

Completing sign-out clears the session, the active shop, the backend choice,
and the in-memory workbook snapshot.
For **local CSV**, the app also removes the persisted folder permission from
browser storage, so a later visit does not silently reopen the previous folder
until the user chooses one again.

Google Drive sign-out follows the same dirty guard; clearing a folder handle
applies only to local CSV persistence.
