# Fixtures for CSV backend (dev/test)

Fixtures are used when running in dev mode (`import.meta.env.DEV`) instead of Google Sheets/Drive APIs.

## Convention

- **Quoted values supported**: The CSV parser handles RFC 4180-style quoted fields and escaped quotes (`""`). You may use commas inside quoted values (e.g. `"Acme, Inc."`). The `audit_log.csv` `after_json` column is always quoted because it contains commas.
- **Folder names**: Alphanumeric, hyphen, underscore only (e.g. `happy-path`, `missingcolumn`, `empty`).
