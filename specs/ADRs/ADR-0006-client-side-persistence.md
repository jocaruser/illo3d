# ADR-0006: Client-side persistence — memory-only token, localStorage shop

- Status: Accepted
- Date: 2026-07-17

## Context

GitHub Pages hosting means all state lives in the browser; the only question is which store
holds what. 

## Decision

Decide per kind of state instead of one blanket store:

| State                       | Store          | Why                                                                                                     |
|-----------------------------|----------------|---------------------------------------------------------------------------------------------------------|
| Google access token         | memory only    | Persisting a bearer token is XSS surface with no benefit: GIS silent renewal re-acquires one on reload. |
| Active shop, backend choice | `localStorage` | Folder and spreadsheet ids are not secrets; persisting them lets returning users land in their shop.    |
| Local CSV directory handle  | IndexedDB      | The only store that can hold a `FileSystemDirectoryHandle`.                                             |
| Language, theme             | `localStorage` | Preferences, unchanged from v2.                                                                         |

Tests assert byte-level that tokens never reach any storage. On app start, a bootstrap
component rehydrates the workbook for a persisted shop (waiting for the GIS script on the
Drive backend).

## Consequences

- Opening a shop is idempotent across tabs and reloads; signing out is an explicit act.
- A reload on the Drive backend needs a silent token renewal before it can sync; failure
  surfaces a re-authenticate banner rather than an error state.
