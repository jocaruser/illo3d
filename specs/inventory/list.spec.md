# Inventory

A page at `#/inventory`:
the shop's materials, one row each,
loaded from the `inventory` table
([schema.dbml](../../schema.dbml)).
The table renders as [all tables do](../shared/table.spec.md)
and behaves as [all lists do](../shared/lists.spec.md);
its quiet empty row teaches where materials come from:
"No inventory items yet.
Record a purchase with “Add to inventory” to create items."

| Column | Notes |
|---|---|
| ID | Opens [the material](details/details.spec.md) |
| Name | With its swatch colour beside it, when one is set |
| Type | Filament, Consumable or Equipment |
| Current stock | Tinted when a warning threshold is crossed — the [material's own](details/details.spec.md) thresholds |
| Avg unit cost | What a unit has cost on average, from its purchases; a dash before any purchase |
| Created | |

There is no "add" button, and nothing edits here:
everything about a material is edited
[on its page](details/details.spec.md).
