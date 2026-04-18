# lot-tracking Specification

## Purpose

Lots as first-class inventory cost layers: sheet schema, parsing, workbook exposure, and average unit cost from active lots per inventory item.

## Requirements

### Requirement: Lot data model is defined

The system SHALL support a lots data model with fields: id (string), inventory_id (string, FK to inventory), transaction_id (string, FK to transactions), quantity (number), amount (number, non-negative — cost of this lot), created_at (date).

#### Scenario: Lot references inventory and transaction

- **WHEN** a lot row exists
- **THEN** it has a valid inventory_id referencing an inventory item and a valid transaction_id referencing a transaction

#### Scenario: Lot preserves purchase cost

- **WHEN** a lot is created with quantity 1000 and amount 29.99
- **THEN** the lot row stores quantity=1000 and amount=29.99 (strictly positive in this scenario)

### Requirement: Lots sheet is a first-class tab

The system SHALL include `lots` in `SHEET_NAMES` and `SHEET_HEADERS`. Headers SHALL be: `id, inventory_id, transaction_id, quantity, amount, created_at, archived, deleted`. Golden fixture folders SHALL include `lots.csv` with a correct header row. `validateStructure` and new-shop creation SHALL treat `lots` like other required sheets.

#### Scenario: Lots headers defined

- **WHEN** `SHEET_HEADERS` is accessed for `lots`
- **THEN** the array is `['id', 'inventory_id', 'transaction_id', 'quantity', 'amount', 'created_at', 'archived', 'deleted']`

#### Scenario: Fixture folder includes lots.csv

- **WHEN** a golden fixture folder exists under `fixtures/`
- **THEN** it contains `lots.csv` with headers matching `SHEET_HEADERS.lots`

### Requirement: matrixToLots parses lot rows

The system SHALL provide a `matrixToLots` function that parses the lots sheet matrix into typed `Lot[]` objects. Rows missing `id`, `inventory_id`, or `transaction_id` SHALL be filtered out. `quantity` and `amount` SHALL be parsed as numbers.

#### Scenario: Valid lot rows are parsed

- **WHEN** lots sheet contains rows with all required fields
- **THEN** `matrixToLots` returns `Lot[]` with numeric `quantity` and `amount`

#### Scenario: Invalid rows are filtered

- **WHEN** lots sheet contains a row missing `id`
- **THEN** that row is excluded from the result

### Requirement: useWorkbookEntities exposes lots

The `useWorkbookEntities` hook SHALL return a `lots` property containing parsed lot data from the workbook store, alongside all other entity arrays.

#### Scenario: Lots available from hook

- **WHEN** a component calls `useWorkbookEntities()`
- **THEN** the returned object includes `lots: Lot[]`

### Requirement: Average unit cost is computed from lots

The system SHALL provide a pure utility function `computeAvgUnitCost(lots: Lot[]): number | null` that computes the weighted average unit cost across all active (non-archived, non-deleted) lots for an inventory item. The formula SHALL be `Σ(lot.amount) / Σ(lot.quantity)` across lots where `lot.quantity > 0`. If no valid lots exist, the function SHALL return `null`.

#### Scenario: Average cost from two lots

- **WHEN** an inventory item has lot A (qty=1000, amount=29.99) and lot B (qty=500, amount=18.99)
- **THEN** avg_unit_cost = (29.99 + 18.99) / (1000 + 500) = 0.03265...

#### Scenario: No lots returns null

- **WHEN** an inventory item has no active lots
- **THEN** avg_unit_cost is null

#### Scenario: Zero-quantity lots are excluded

- **WHEN** a lot has quantity=0
- **THEN** it is excluded from the average calculation
