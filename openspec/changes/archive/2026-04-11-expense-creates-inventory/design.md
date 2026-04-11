## Context

`createExpense` currently performs a 2-read, 2-write operation: it reads existing expense and transaction IDs for sequential numbering, then appends one row to each sheet. The `Inventory` type, `InventoryType`, and `SHEET_HEADERS.inventory` are already defined but unused. The inventory fixture CSV exists with headers only.

The money-tracking spec requires that material expenses produce inventory records, but this has never been implemented. During exploration, we determined that the decision of which expenses create inventory should not be hardcoded by category — the user should opt in at creation time via a toggle. This handles edge cases like tracking a printer (investment) or not tracking a trivial consumable.

Quantity represents the smallest billable/transformable unit: grams for filament, individual units for consumables and equipment.

## Goals / Non-Goals

**Goals:**

- Users can opt in to creating an inventory record when creating any expense, via a toggle
- Inventory type is selected independently from expense category (filament, consumable, equipment)
- Type-aware quantity hints guide users on the expected unit
- Inventory name is editable, prefilled from expense notes for convenience

**Non-Goals:**

- Backfilling inventory for pre-existing expenses (handled externally via bulk insert)
- Inventory editing UI (users edit in Google Sheets for now)
- Piece_items consumption flow (separate future change)
- Printers/equipment table with dedicated fields like print hours or maintenance logs (future change)
- Unit-of-measure field on inventory (quantity semantics are implicit per type for now)

## Decisions

### 1. Opt-in toggle instead of category-driven automation

The form shows an "Add to inventory" checkbox. When checked, a section appears with inventory type, name, and quantity fields. Any expense category can produce an inventory record — the user decides.

**Alternative considered**: Automatically create inventory for `filament` and `consumable` categories. Rejected because it can't handle investment-category items that are physical (printers, enclosures) and forces inventory creation for trivial consumables the user doesn't care to track.

### 2. Expand `InventoryType` to include `equipment`

```
'filament' | 'consumable' | 'equipment'
```

Equipment covers printers, enclosures, and similar physical assets. These have `qty_initial: 1` and are not consumed per-piece like filament, but the user still wants them visible in the inventory list and linked to the expense that paid for them.

**Alternative considered**: Keep only `filament | consumable`. Rejected because it excludes physical assets the user wants to track.

### 3. Sequential IDs via `nextNumericId('INV', ...)`

Reuse the existing `nextNumericId` helper with prefix `INV`, producing `INV1`, `INV2`, etc. Consistent with `E1`/`T1` patterns throughout the codebase.

**Alternative considered**: Timestamp-based IDs. Rejected — breaks the established pattern, makes fixtures harder to write, no benefit given single-user concurrency.

### 4. Lazy inventory read

The inventory sheet is only read when the user opts in to creating an inventory record. Expenses without inventory keep the existing 2-read + 2-write cost. Expenses with inventory become 3-read + 3-write.

### 5. Inventory name prefilled from notes, independently editable

When the toggle is checked, the name field defaults to the current value of `notes`. The user can edit it independently. If notes is empty and the user doesn't type a name, fall back to `"<Type> - <date>"` (e.g., `"Filament - 2026-04-11"`).

**Alternative considered**: Notes IS the name (no separate field). Rejected — coupling notes to inventory name is fragile and the user should be able to write detailed notes while keeping the inventory name concise.

### 6. Type-aware quantity hints

The quantity input shows a hint derived from the selected **inventory type**, not the expense category:

| Inventory Type | Hint |
|---|---|
| filament | (g) |
| consumable | (units) |
| equipment | (units) |

Default quantity is 1. Required and must be > 0 when the toggle is checked.

### 7. `created_at` is automatic

Inventory `created_at` uses `new Date().toISOString()` — the moment the record is written. This differs from the expense `date` (purchase date) which may be set retroactively.

### 8. `createExpense` signature change

Add optional inventory parameters to the payload:

```typescript
interface CreateExpensePayload {
  date: string
  category: ExpenseCategory
  amount: number
  notes?: string
  inventory?: {
    type: InventoryType
    name: string
    quantity: number
  }
}
```

When `inventory` is present, the service reads the inventory sheet for ID generation and appends an inventory row. When absent, behavior is unchanged.

## Risks / Trade-offs

**No atomicity across sheet writes** → If expense + transaction succeed but the inventory write fails, an orphan expense exists without its inventory. Same risk already exists between expenses and transactions. Mitigation: inventory write is last, so partial failure is detectable. Inherent to the spreadsheet-as-database approach.

**Quantity default of 1 may surprise filament users** → A 1kg roll should be 1000g, but default is 1. Mitigation: the `(g)` hint makes the expected unit visible. The field is prominent and required when shown.

**User might forget to toggle** → If someone buys filament and forgets to check "Add to inventory", no inventory is created. Mitigation: this is a conscious UX tradeoff — opt-in avoids unwanted inventory rows and gives the user control. If it becomes a pain point, we can add a reminder when category is filament/consumable.
