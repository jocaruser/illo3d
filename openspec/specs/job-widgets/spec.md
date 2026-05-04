## ADDED Requirements

### Requirement: Job header renders as a responsive widget grid
The system SHALL render the job detail header as a grid of widgets instead of a static card. The grid SHALL use CSS Grid with 3 columns on medium screens and above. The ID widget SHALL span 2 columns. All other widgets SHALL span 1 column. On small screens, all widgets SHALL span the full width.

#### Scenario: Desktop layout shows 3-column grid
- **WHEN** the user views a job detail page on a screen wider than the medium breakpoint
- **THEN** the ID widget spans 2 columns and other widgets span 1 column each

#### Scenario: Mobile layout stacks widgets
- **WHEN** the user views a job detail page on a small screen
- **THEN** all widgets stack vertically with full width

### Requirement: Widgets display job fields with labels and values
Each widget SHALL display a label and a value. Labels SHALL use i18n. Values SHALL be formatted according to their type (currency, count, text, status badge).

#### Scenario: Widget shows label and formatted value
- **WHEN** a widget renders for Total with value €165.00
- **THEN** the label "Total" is visible and the value "€165.00" is displayed

### Requirement: ID widget shows job id
The ID widget SHALL display the job's `id` field as plain text. It SHALL span 2 columns in the grid.

#### Scenario: ID widget displays job id
- **WHEN** a job has id "J1"
- **THEN** the ID widget shows "J1"

### Requirement: Status widget is an inline editable dropdown
The Status widget SHALL display the current job status using a `Combobox` component with all five job statuses as options. Selecting a new status SHALL immediately trigger `updateJobStatus` with the same confirmation dialogs as the jobs list status dropdown.

#### Scenario: Status widget shows current status
- **WHEN** a job has status "in_progress"
- **THEN** the Status widget shows the localized label for "in_progress"

#### Scenario: Status widget allows inline change
- **WHEN** the user selects "delivered" from the Status widget dropdown
- **THEN** the status updates immediately with appropriate confirmation dialog behavior

### Requirement: Total widget shows derived total from pieces
The Total widget SHALL display the sum of `piece.price × piece.units` for all non-deleted counting pieces of the job. If any counting piece has unset `price` or unset `units`, the widget SHALL show the incomplete pricing label with visually distinct styling.

#### Scenario: Complete pricing shows total
- **WHEN** all counting pieces have set `price` and `units`
- **THEN** the Total widget shows the sum formatted as currency

#### Scenario: Incomplete pricing shows highlight
- **WHEN** at least one counting piece has unset `price` or `units`
- **THEN** the Total widget shows the incomplete label with colored background and border styling

### Requirement: Client widget is a clickable link
The Client widget SHALL display the client's resolved name and SHALL be a clickable link to `/clients/:clientId` for the job's `client_id`. The Edit modal SHALL still allow changing the client.

#### Scenario: Client widget links to client detail
- **WHEN** a job has client_id "CL1" and client "CL1" has name "Alice"
- **THEN** the Client widget shows "Alice" as a link to `/clients/CL1`

### Requirement: Due Date widget shows days since creation with color gradient
The Due Date widget SHALL display the number of days elapsed since `job.created_at`. The widget background SHALL use a color gradient based on elapsed days: yellow at +3 days, orange at +5 days, red at +7 days. Text color SHALL maintain contrast against the background.

#### Scenario: Due date shows days ago
- **WHEN** a job was created 4 days ago
- **THEN** the Due Date widget shows "4 days ago" with yellow background

#### Scenario: Due date shows red for old jobs
- **WHEN** a job was created 8 days ago
- **THEN** the Due Date widget shows "8 days ago" with red background

### Requirement: Total beneficio widget shows revenue minus material cost
The Total beneficio widget SHALL display `Total revenue - Total material cost`. Total revenue is `Σ(piece.price × piece.units)`. Total material cost is `Σ(piece_item.quantity × avg_unit_cost)` where `avg_unit_cost` comes from `computeAvgUnitCost` for that inventory's lots. If total revenue is incomplete (any piece lacks price or units), the widget SHALL show the incomplete pricing label.

#### Scenario: Beneficio shows positive value
- **WHEN** total revenue is €165.00 and material cost is €35.28
- **THEN** the Total beneficio widget shows "€129.72"

### Requirement: Filament widget shows total grams consumed
The Filament widget SHALL display the sum of `piece_item.quantity` for all piece items where the linked inventory has `type === 'filament'`. If no filament items exist, the widget SHALL show 0g or a placeholder.

#### Scenario: Filament shows total grams
- **WHEN** a job uses 985g of PLA and 450g of PETG
- **THEN** the Filament widget shows "1,435g"

### Requirement: Consumibles widget shows total units consumed
The Consumibles widget SHALL display the sum of `piece_item.quantity` for all piece items where the linked inventory has `type === 'consumable'`. If no consumable items exist, the widget SHALL show 0 or a placeholder.

#### Scenario: Consumibles shows total units
- **WHEN** a job uses 2 units of nozzle pack and 1 unit of glue
- **THEN** the Consumibles widget shows "3 units"

### Requirement: Material cost widget shows estimated cost from lots
The Material cost widget SHALL display the sum of `piece_item.quantity × avg_unit_cost` for all piece items, where `avg_unit_cost` is computed from active lots for that inventory via `computeAvgUnitCost`. If an inventory has no lots, its cost contribution SHALL be 0.

#### Scenario: Material cost shows estimated cost
- **WHEN** piece items consume materials with known lot costs
- **THEN** the Material cost widget shows the total estimated cost formatted as currency
