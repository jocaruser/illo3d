## Why

The money-tracking spec requires that certain expenses create corresponding inventory records. Currently `createExpense` only writes to the expenses and transactions sheets. Inventory never gets populated, which blocks piece_items consumption tracking and cost-per-unit calculations downstream. Additionally, the current `InventoryType` is limited to `filament | consumable`, but physical purchases like printers and enclosures should also be trackable in inventory.

## What Changes

- Add an "Add to inventory" toggle to `CreateExpensePopup`. When checked, an inventory section appears with: type (dropdown), name (prefilled from notes, editable), and quantity (with type-aware hint). This is opt-in — the user decides whether any given expense creates an inventory record, regardless of expense category.
- Expand `InventoryType` from `'filament' | 'consumable'` to `'filament' | 'consumable' | 'equipment'` to support tracking printers, enclosures, and similar physical assets.
- Extend `createExpense` to accept optional inventory fields (`inventoryType`, `inventoryName`, `quantity`). When provided, it appends an inventory row alongside the expense and transaction rows.
- Inventory `created_at` is set automatically (`new Date().toISOString()`), independent of the expense's editable `date` field.
- Inventory IDs follow the existing sequential pattern (`INV1`, `INV2`, ...) via `nextNumericId`.
- Add i18n keys for the inventory toggle, type selector, name field, quantity field, and type-aware hints.
- Add fixture rows for expenses with matching inventory records.

## Capabilities

### New Capabilities

_(none — this implements an existing requirement)_

### Modified Capabilities

- `money-tracking`: The CreateExpensePopup gains an opt-in inventory toggle with type/name/quantity fields, the expense creation flow conditionally writes an inventory row, and `InventoryType` expands to include `equipment`.

## Impact

- `src/types/money.ts` — expand `InventoryType` to include `'equipment'`
- `src/services/expense/createExpense.ts` — signature change (new optional inventory params), conditional write to inventory sheet
- `src/components/CreateExpensePopup.tsx` — inventory toggle with conditional type/name/quantity inputs
- `src/services/expense/createExpense.test.ts` — new test cases for inventory creation and non-creation
- `src/components/CreateExpensePopup.test.tsx` — new test cases for toggle, field visibility, and validation
- i18n locale files — new keys for inventory section
- `public/fixtures/happy-path/` — new rows in expenses, inventory, and transactions CSVs
