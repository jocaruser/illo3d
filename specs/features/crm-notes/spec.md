# CRM notes (client and job detail)

## Listing order

Active notes shown in the client or job notes section SHALL be ordered **newest first**, using each note's `created_at` timestamp.

When two notes share the same `created_at`, their relative order SHALL be stable (tie-break by note id ascending).

Notes with an empty `created_at` SHALL sort after all dated notes (treated as oldest).

## Mentions in note bodies

Note bodies MAY contain `@CL…`, `@J…`, and `@P…` tokens.

- A client or job mention SHALL render as a navigable link only when an **active** (non-archived, non-deleted) client or job with that id exists in the workbook.
- When no active entity matches, the token SHALL render as plain text and SHALL NOT navigate to a detail route.
- Piece mentions SHALL follow the existing piece-to-job deep-link rules: link when the piece resolves to an active job path; otherwise plain text.

The prominent-severity alert strip above the notes list SHALL use the same mention rules as the note list.
