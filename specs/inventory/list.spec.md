# Inventory

Every active material — but no "add" button:
**materials are born from purchases**
(a future `transactions/purchase.spec.md` describes it),
and the empty state teaches exactly that:
"No inventory items yet.
Record a purchase with "Add to inventory" to create items."

The table behaves as
[all lists do](../jobs/list.spec.md#how-lists-behave-all-of-them).

| Column | Notes |
|---|---|
| ID | Opens the material |
| Name | With its swatch colour beside it, when one is set |
| Type | Filament, Consumable or Equipment |
| Current stock | Tinted when a warning threshold is crossed — the [material's own](details/item.spec.md) thresholds |
| Avg unit cost | What a unit has cost on average, from its purchases; a dash before any purchase |
| Created | |

Everything about a material is edited
[on its page](details/item.spec.md) —
the list only shows.
