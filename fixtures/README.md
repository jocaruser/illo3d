# Fixtures for CSV backend (dev/test)

Fixtures are used when running in dev mode (`import.meta.env.DEV`) instead of Google Sheets/Drive APIs.

## Convention

- **No embedded commas**: CSV files use `split(',')` for parsing. Values containing commas (e.g. `"Acme, Inc."`) are **not** supported. Keep fixture data free of commas inside quoted values.
- **Folder names**: Alphanumeric, hyphen, underscore only (e.g. `happy-path`, `missingcolumn`, `empty`).
