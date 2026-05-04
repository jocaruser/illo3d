## ADDED Requirements

### Requirement: Materials summary section displays aggregated piece items by inventory
The system SHALL render a "Materials Summary" section on the job detail page below the widget grid. The section SHALL contain a table with one row per unique `inventory_id` referenced by piece items of pieces in this job.

#### Scenario: Summary section renders below widgets
- **WHEN** the user views a job detail page
- **THEN** a "Materials Summary" section appears below the header widgets

### Requirement: Summary table columns
Each row in the summary table SHALL display: Inventory Name (resolved from inventory), Total Quantity (sum of `piece_item.quantity` for that inventory), Estimated Cost (`total_quantity × avg_unit_cost` from lots), Redos (`floor((inventory.qty_current - total_quantity) / total_quantity)` for filament items; "—" for others), and Used In (comma-separated piece names, wrapping to next line as needed).

#### Scenario: Summary row shows all columns
- **WHEN** a job uses PLA White across two pieces
- **THEN** the summary row shows "PLA White", total grams, estimated cost, redos count, and both piece names separated by commas

### Requirement: Summary table sorted by inventory type then name
Rows SHALL be sorted by inventory type (filament first, then consumable, then equipment) and then alphabetically by inventory name within each type.

#### Scenario: Filament items appear before consumables
- **WHEN** a job uses both PLA (filament) and Nozzle Pack (consumable)
- **THEN** PLA appears before Nozzle Pack in the summary table

### Requirement: Overall risk factor shows minimum redos
Below the summary table, the system SHALL display the overall risk factor: the minimum redos value across all filament inventory rows in the summary. The display SHALL include the inventory name that represents the minimum.

#### Scenario: Overall risk shows minimum redos
- **WHEN** filament redos are PLA=64 and PETG=8
- **THEN** the overall risk factor shows "8" and names "PETG"

#### Scenario: Overall risk uses color scale
- **WHEN** minimum redos is 8
- **THEN** the risk indicator uses the green color (≥2 redos = safe)

### Requirement: Empty summary handled gracefully
When a job has no piece items, the Materials Summary section SHALL show an empty state message using i18n instead of an empty table.

#### Scenario: No materials shows empty state
- **WHEN** a job has pieces but no piece items
- **THEN** the Materials Summary section shows "No materials used" (or equivalent i18n)
