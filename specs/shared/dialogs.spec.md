# The dialog

The default spec for the app's dialogs —
wherever a flow needs answers before the page continues:
creating and editing, confirmations, the wizards.

One shell for all of them:
the page dims behind it;
clicking the dim, or Escape, closes —
and closing is cancelling, never a half-submit.
The footer holds the choices,
Cancel beside the confirming action.

- A **create or edit dialog** is the entity's own `create.spec.md`:
  its fields, in order, the required ones named;
  edit is the same dialog, prefilled.
  Submitting changes the shop in memory
  ([saving](../saving/saving.spec.md)).
- A **confirmation** asks one question
  and quotes its consequence
  ("Archive "‹name›" and all its purchase lots?").

A respec is expected to swap the shell
from a centred dialog to a side panel;
only this file should need to change for it.
