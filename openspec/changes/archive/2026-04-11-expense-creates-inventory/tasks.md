## 1. Type and Model Changes

- [x] 1.1 Add `'equipment'` to `InventoryType` in `src/types/money.ts`
- [x] 1.2 Add optional `inventory` field to `CreateExpensePayload` in `src/services/expense/createExpense.ts` with shape `{ type: InventoryType, name: string, quantity: number }`

## 2. Service Logic

- [x] 2.1 Extend `createExpense` in `src/services/expense/createExpense.ts` to conditionally read the inventory sheet and append an inventory row when `payload.inventory` is provided. Use `nextNumericId('INV', ...)` for the ID and `new Date().toISOString()` for `created_at`
- [x] 2.2 Add unit tests in `src/services/expense/createExpense.test.ts`: filament expense with inventory creates inventory row, equipment expense with inventory creates inventory row, expense without inventory does not read or write inventory sheet, quantity flows through to `qty_initial` and `qty_current`

## 3. UI — Inventory Toggle and Fields

- [x] 3.1 Add "Add to inventory" toggle to `src/components/CreateExpensePopup.tsx`. When checked, show inventory type (select: filament, consumable, equipment), name (text, prefilled from notes), and quantity (number, default 1) fields
- [x] 3.2 Add type-aware quantity hint: `(g)` for filament, `(units)` for consumable and equipment
- [x] 3.3 Update validation in `CreateExpensePopup`: when toggle is checked, require inventory name (non-empty) and quantity (> 0). Skip inventory validation when toggle is unchecked
- [x] 3.4 Pass `inventory` object to `createExpense` when toggle is checked; omit it when unchecked

## 4. i18n

- [x] 4.1 Add i18n keys to `src/locales/en.json` and `src/locales/es.json`: `expenses.addToInventory`, `expenses.inventoryType`, `expenses.inventoryName`, `expenses.inventoryNamePlaceholder`, `expenses.quantity`, `expenses.quantityHintGrams`, `expenses.quantityHintUnits`, `expenses.inventoryType.filament`, `expenses.inventoryType.consumable`, `expenses.inventoryType.equipment`, `expenses.validation.inventoryNameRequired`, `expenses.validation.quantityPositive`

## 5. Component Tests

- [x] 5.1 Add tests in `src/components/CreateExpensePopup.test.tsx`: toggle is unchecked by default and inventory fields are hidden, checking toggle shows inventory type/name/quantity fields, unchecking toggle hides inventory fields, name is prefilled from notes, validation rejects empty name and zero quantity when toggle is checked, validation ignores inventory fields when toggle is unchecked

## 6. Fixtures

- [x] 6.1 Add filament and equipment expense rows to `public/fixtures/happy-path/expenses.csv` with matching inventory rows in `public/fixtures/happy-path/inventory.csv` and transaction rows in `public/fixtures/happy-path/transactions.csv`

## 7. E2E Tests

- [x] 7.1 Update `tests/e2e/create-expense.spec.ts`: test creating an expense with inventory toggle checked (verify inventory row is written), test creating an expense without toggle (verify no inventory row)

## 8. Manual Verification

- [x] 8.1 Use browser MCP to manually test: create a filament expense with inventory toggle, verify inventory row appears; create an electric expense without toggle, verify no inventory row; check quantity hint changes when switching inventory type
