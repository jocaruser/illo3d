# The shop's metadata file

Every shop folder contains one small identity file,
`illo3d.metadata.json`,
kept beside the shop's data.
It is what makes a folder *a shop*:
the [welcome flows](../welcome/welcome.spec.md) look for it,
and a folder without a readable one
is treated as not being a shop at all.

A user can open it — it is theirs, in their own storage —
though the app never asks them to.
The [profile menu](../profile.spec.md) offers
**"Edit metadata.json"** as the app's own door to it.

What it records, in user terms:

| Field | Meaning |
|---|---|
| app | Always "illo3d" — marks the folder as this app's |
| version | The app version that created or last [migrated](../migration/wizard.spec.md) the shop |
| spreadsheetId | Which data file the shop's numbers live in |
| createdAt, createdBy | When the shop was made, and by whom |
| logo *(optional)* | An image file beside it, shown as the shop's own mark in the [header](../navigation.spec.md) |
| iconsrc, userName *(optional)* | A local shop's avatar image and display name for the [profile menu](../profile.spec.md) |
| kanban *(optional)* | Board tuning — how many days until paid or cancelled jobs leave [the dashboard's board](../dashboard/kanban.spec.md) |
| defaultDueDate *(optional)* | How many days from now a new job's due date suggests |

The reference for the exact shape is the code's own definition
([`src/Entity/ShopMetadata.ts`](../../src/Entity/ShopMetadata.ts));
the shop's *data* layout is [`schema.dbml`](../../schema.dbml)'s.

Editing this file by hand is possible but unguarded:
a damaged file makes the folder unrecognisable as a shop —
with consequences described in
[local folder](../welcome/local-folder.spec.md).
