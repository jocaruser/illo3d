# Shared dialogs

Page and flow specs describe *what* happens in a given screen;
this file describes **how every modal behaves** so authors can link here
instead of repeating scrim, focus, dismiss, and busy-state rules.

Three families appear in the product:

1. **Standard dialogs** — centred panel over a dimmed background;
   dismissible unless a flow opts out.
2. **Blocking operations** — full-screen progress while a long workbook
   action runs; never dismissible.
3. **Guided wizards** — large welcome or migration panels that stay open
   until the user chooses an explicit action.

Scenario detail for saving, migration, and local-folder flows stays in those
specs; only shared mechanics live here.

## Standard dialogs

When a standard dialog opens:

- A **semi-transparent scrim** covers the page behind a **centred panel**.
- The panel is announced as a **modal dialog** with a visible **title**
  at the top.
- Keyboard focus moves **into the panel** as soon as it opens.
- **Tab** cycles through controls **inside the panel only**;
  focus does not reach the page behind while the dialog is open.

When the dialog is **dismissible** (the default):

- **Escape**, clicking the **scrim**, and an explicit **cancel** action
  all close the dialog **without committing** whatever the dialog was
  asking about.
- Clicking **inside the panel** does not close it.

**Actions** sit together at the bottom of the panel, typically
**cancel** on one side and **primary** on the other.

While work is **in progress** on the primary action:

- **Both** actions are unavailable.
- The primary action shows a **waiting label** (for example
  "Submitting…") instead of its normal wording.

If something goes wrong **before** the dialog closes:

- **Validation or server errors** appear as an **alert inside the panel**.
- The dialog **stays open** so the user can fix the problem or cancel.

## Confirmation

Yes/no and confirm/cancel prompts use the **standard dialog** shell.

- A **title** and short **message** explain what will happen.
- Optional **extra content** may appear between the message and the buttons —
  for example a checkbox to create a related record when confirming a job
  status change.
- The **destructive or committing action** runs only after the user presses
  the confirm button; cancel, Escape, and scrim click abandon the change.

Flows that need richer choices (such as job status changes with optional
side effects) still use this pattern rather than inventing a new shell.
See the jobs and kanban page specs for *when* those prompts appear; this
file only defines *how* they behave.

## Form dialogs

Create and edit overlays (clients, inventory, and similar) also use the
**standard dialog** shell, but their body is a **form** instead of a
short message.

- Whenever the dialog **opens**, its fields **reset** to match what is being
  created or edited — a reopened dialog never shows stale input from the
  last time it was open.
- The user submits with the **primary** button at the bottom of the form.
- **Field-level errors** stay visible **inside the panel** without closing it.
- After a **successful save**, a brief success acknowledgement appears and
  the dialog **closes**.

Cancel, Escape, and scrim click still discard unsubmitted edits.

## Blocking operations

During a **blocking workbook operation** (chiefly **Save**, as described in
[saving](../saving.spec.md)):

- The **entire viewport** is covered — not just a centred card on a dimmed
  page, but an opaque layer that blocks interaction with everything behind it.
- The user **cannot dismiss** the overlay: no cancel button, no scrim click,
  no Escape-to-close.
- Keyboard focus **stays inside** the overlay.
- The overlay shows a **progress message**, optionally the **name of the
  part** currently being written, and a **fraction complete**
  ("‹current› of ‹total›") with a progress bar.

Non-blocking operations (such as a quiet reload) use toasts instead;
they do not use this overlay.

## Wizard overlays

**Migration** and **local-shop setup** use a third pattern: a **large,
scrollable panel** above a dimmed background, deliberately **not** the
standard dismissible shell.

Shared behaviour:

- The panel can be **taller than the viewport**; the user scrolls within the
  overlay when content overflows.
- **Escape does not close** the wizard.
- Clicking the **dimmed background does not close** the wizard.
- The user must choose an explicit action — **Continue**, **Confirm**,
  **Log out**, or similar — to leave.

**Migration wizard** ([scenario detail](../migration/wizard.spec.md)):

- Shows version comparison, backup question, step grid, and paced
  **Continue**.
- Exposes **language and theme** controls in the panel header because the
  user has not reached the main app chrome yet.
- **Log out** returns to the welcome screen without changing the shop.

**Local-folder create confirm** ([scenario detail](../welcome/local-folder.spec.md)):

- Warns before creating a new shop in a folder that does not yet hold one.
- Uses the **standard dialog** dismiss rules (cancel, Escape, scrim) because
  it is a short confirm, not the full migration panel.

**Welcome setup** (no active shop):

- The whole welcome experience renders as a **full-screen gate** until a
  shop opens or is created; that gate is not dismissible with Escape or
  scrim — only by completing a path or signing out.

## Related consumers

- **[Saving](../saving.spec.md)** — blocking overlay during workbook save.
- **[Migration wizard](../migration/wizard.spec.md)** — non-dismissible
  upgrade panel.
- **[Local folder](../welcome/local-folder.spec.md)** — create confirm and
  migration entry.
- **Job status and kanban** — confirmation prompts with optional extra
  choices; lifecycle rules live on the jobs specs, not here.
