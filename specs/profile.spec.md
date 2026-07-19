# Profile menu

The avatar at the right end of the [header](navigation.spec.md)
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
  opening the shop's folder in a new tab.
  Locally: the folder's name.
- **Preferences.**
  The same language (EN/ES) and theme (light/dark) choices
  as [the welcome screen](welcome/welcome.spec.md) —
  one preference, editable from either place.
- **Versions.**
  One quiet line: "App ‹version› · Shop ‹version›" —
  the app you are running,
  and the version your shop's files are on
  (they only differ transiently;
  [the migration wizard](migration/wizard.spec.md) exists to close the gap).
- **"Edit metadata.json"** — the app's own door to
  [the shop's metadata file](entities/metadata.spec.md).
- **"Changelog"** — a placeholder, visibly disabled.
- **Sign out.**
  Closes the shop and returns to the
  [welcome screen](welcome/welcome.spec.md).
  [Unsaved changes](saving/saving.spec.md) are discarded —
  today without the confirmation that Refresh asks for.
