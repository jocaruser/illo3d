# Inventory

The listing page for the shop's materials.
It lives at `#/inventory`
and follows [the list page](../shared/list.spec.md);
its title is "Inventory".
The rows load from the `inventory` table
([schema.dbml](../../schema.dbml)).

| Column | Notes |
|---|---|
| ID | Opens [the material](details/details.spec.md) |
| Name | With its swatch colour beside it, when one is set |
| Type | Filament, Consumable or Equipment |
| Current stock | Tinted when a warning threshold is crossed — the [material's own](details/details.spec.md) thresholds |
| Avg unit cost | What a unit has cost on average, from its purchases; a dash before any purchase |
| Created | |

Where it departs from the default:

- **No Add button** — materials are created by
  [purchases](../transactions/purchase.spec.md),
  and the quiet empty row
  ([tables](../shared/table.spec.md)) teaches that:
  "No inventory items yet.
  Record a purchase with “Add to inventory” to create items."
- **No Actions column** — everything about a material is edited
  [on its page](details/details.spec.md).
