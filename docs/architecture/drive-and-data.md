# Drive and data flow

## Overview

- **Storage**: Google Drive app data folder (scope `drive.appdata`). Hidden per-app folder; only this app can read/write. File: `database.json` (same structure as docs/context.txt and docs/database-schema.json).
- **Auth**: User signs in with Google on LoginPage (One Tap or "Sign in with Google" button). After sign-in, Drive access is requested in the same flow: `useGoogleLogin` with scope `https://www.googleapis.com/auth/drive.appdata` opens; when the user grants access, the app navigates to /. Token is stored in DriveContext (memory only; cleared on logout).
- **Load**: On Home, user clicks "Load from Drive" → `readDatabase(accessToken)` → `loadFromDatabase(db)` on InventoryContext and `setLastLoadedDatabase(db)`.
- **Save**: User clicks "Save to Drive" → `buildDatabaseFromInventory(...)` → `saveDatabase(accessToken, db)` → `setLastLoadedDatabase(db)`.

## Google Cloud

- Enable **Google Drive API** in the same project as the OAuth client.
- OAuth consent screen: add scope for Drive app data if required by your project (often same client works for Drive after enabling the API).

## Out of scope (later)

- Backup folder and timestamped copies (see context.txt backup strategy).
- Refresh token / offline access (would require auth-code flow and backend).
- Pieces, clients, sales, kanban in UI (database type and file support them; inventory slice only for v1).
