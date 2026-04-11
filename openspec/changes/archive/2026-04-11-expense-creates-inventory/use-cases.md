## Overview

The expense creation flow gains an opt-in inventory toggle. When creating any expense, the user can check "Add to inventory" to also create an inventory record with a chosen type (filament, consumable, equipment), name, and quantity. The inventory section is hidden by default and only validated when visible. Expenses without the toggle behave exactly as before.

## Use Cases to Test

- Expense creates inventory row
- Expense without inventory toggle
- Inventory toggle shows fields
- Inventory toggle hides fields
- Inventory quantity validation
- Inventory name prefilled from notes
- Quantity hint changes per type
- Equipment type in inventory
- Inventory fields i18n strings
