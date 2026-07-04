# Spreadsheet formulas for v2 audit_log migration

If you want to convert legacy `crm_notes` and `tag_links` rows inside a
spreadsheet (Google Sheets, Excel, LibreOffice Calc) before exporting
`audit_log.csv`, use the one-column formulas below. Each formula builds a
single `audit_log` CSV row, including the quoted `after_json` snapshot.

## Assumptions

- Row 1 is the header; data starts in row 2.
- Paste the formula in the first empty column next to the old data, fill down,
  copy the results, then paste values only into `audit_log.csv`.
- `actor` is hard-coded as `local`. Change it to the user email if you know it.
- Audit IDs must not overlap between `crm_notes` and `tag_links`. The tag-link
  formula offsets IDs by the number of `crm_notes` rows.
- Cells that contain line breaks may need manual cleanup after pasting. The
  `migrate-v2-audit-log.mjs` script handles those edge cases more reliably.

## `crm_notes` formula

Assume `crm_notes` columns are:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| `id` | `entity_type` | `entity_id` | `body` | `referenced_entity_ids` | `severity` | `created_at` |

Paste this in `H2` and fill down:

```text
="AL"&ROW()-1&","&G2&",local,crm_note,"&A2&",create,,"&CHAR(34)&SUBSTITUTE("{"&CHAR(34)&"id"&CHAR(34)&":"&CHAR(34)&A2&CHAR(34)&","&CHAR(34)&"entity_type"&CHAR(34)&":"&CHAR(34)&B2&CHAR(34)&","&CHAR(34)&"entity_id"&CHAR(34)&":"&CHAR(34)&C2&CHAR(34)&","&CHAR(34)&"body"&CHAR(34)&":"&CHAR(34)&D2&CHAR(34)&","&CHAR(34)&"referenced_entity_ids"&CHAR(34)&":"&CHAR(34)&E2&CHAR(34)&","&CHAR(34)&"severity"&CHAR(34)&":"&CHAR(34)&F2&CHAR(34)&","&CHAR(34)&"created_at"&CHAR(34)&":"&CHAR(34)&G2&CHAR(34)&","&CHAR(34)&"archived"&CHAR(34)&":"&CHAR(34)&CHAR(34)&","&CHAR(34)&"deleted"&CHAR(34)&":"&CHAR(34)&CHAR(34)&"}",CHAR(34),CHAR(34)&CHAR(34))&CHAR(34)&",,"
```

Copy column `H`, then in `audit_log.csv` paste values only under the header
row.

## `tag_links` formula

Assume `tag_links` columns are:

| A | B | C | D | E |
|---|---|---|---|---|
| `id` | `tag_id` | `entity_type` | `entity_id` | `created_at` |

Paste this in `F2` and fill down. It offsets IDs by the number of rows in
`crm_notes` so audit IDs stay unique:

```text
="AL"&ROW()-1+COUNTA(crm_notes!A:A)-1&","&E2&",local,tag_link,"&A2&",create,,"&CHAR(34)&SUBSTITUTE("{"&CHAR(34)&"id"&CHAR(34)&":"&CHAR(34)&A2&CHAR(34)&","&CHAR(34)&"tag_id"&CHAR(34)&":"&CHAR(34)&B2&CHAR(34)&","&CHAR(34)&"entity_type"&CHAR(34)&":"&CHAR(34)&C2&CHAR(34)&","&CHAR(34)&"entity_id"&CHAR(34)&":"&CHAR(34)&D2&CHAR(34)&","&CHAR(34)&"created_at"&CHAR(34)&":"&CHAR(34)&E2&CHAR(34)&","&CHAR(34)&"archived"&CHAR(34)&":"&CHAR(34)&CHAR(34)&","&CHAR(34)&"deleted"&CHAR(34)&":"&CHAR(34)&CHAR(34)&"}",CHAR(34),CHAR(34)&CHAR(34))&CHAR(34)&",,"
```

If your `crm_notes` sheet has a different name, replace `crm_notes!A:A` with
the correct sheet reference.

## Finish

1. Paste the `crm_notes` CSV rows into `audit_log.csv` first.
2. Append the `tag_links` CSV rows underneath.
3. Delete the legacy `crm_notes` and `tag_links` sheets/CSV files.
4. Update `illo3d.metadata.json` to `"version": "2.0.0"`.
