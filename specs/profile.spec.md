# Profile menu

The profile avatar in the header opens a menu for identity, shop context,
preferences, version information, and sign-out.

## Sign out

Choosing **Sign out** ends the session and returns the user to the welcome
experience through the same routing as today.

When a shop is open and the workbook has **unsaved changes**, sign-out asks
**"Discard unsaved changes?"** before clearing anything — the same prompt as
[Refresh](saving.spec.md#refreshing).
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
