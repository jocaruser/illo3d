## Purpose

Define the layout and behavior of the `ListTablePageHeader` component and related table components for consistent page headers across list-table pages.

## Requirements

### Requirement: ListTablePageHeader renders title, search, and actions in a single row
The ListTablePageHeader component SHALL render three sections in a flex container: title (left), search field (center/flex-1), and actions (right).

#### Scenario: Desktop layout (≥640px)
- **WHEN** the viewport is at least 640px wide
- **THEN** title, search field, and actions SHALL appear in a single horizontal row

#### Scenario: Mobile layout (<640px)
- **WHEN** the viewport is less than 640px wide
- **THEN** title, search field, and actions SHALL stack vertically

#### Scenario: Search field width constraint
- **WHEN** the header renders with a search field
- **THEN** the search container SHALL have `min-w-[12rem] flex-1` to fill space without excessive stretching

### Requirement: ListTablePageHeader accepts title, search, and actions props
The ListTablePageHeader component SHALL accept three props: `title` (string), `search` (React node for search field), and `actions` (React node for action buttons).

#### Scenario: Rendering with all props
- **WHEN** all props (title, search, actions) are provided
- **THEN** all three sections SHALL render in the header

#### Scenario: Rendering without search
- **WHEN** the `search` prop is not provided
- **THEN** the search section SHALL not render, and title and actions SHALL still display

#### Scenario: Rendering without actions
- **WHEN** the `actions` prop is not provided
- **THEN** the actions section SHALL not render, and title and search SHALL still display

### Requirement: Pages lift search state and pass query to table components
List-table pages (Clients, Jobs, Transactions, Inventory, JobDetail, ClientDetail) SHALL manage search query state at page level using `useState` and pass `query` prop to table components.

#### Scenario: ClientsPage with search
- **WHEN** user types in the search field in ClientsPage header
- **THEN** the query state SHALL update and be passed to ClientsTable for filtering

#### Scenario: JobsPage with search
- **WHEN** user types in the search field in JobsPage header
- **THEN** the query state SHALL update and be passed to JobsTable for filtering

#### Scenario: TransactionsPage with search
- **WHEN** user types in the search field in TransactionsPage header
- **THEN** the query state SHALL update and be passed to TransactionsTable for filtering

#### Scenario: InventoryPage with search
- **WHEN** user types in the search field in InventoryPage header
- **THEN** the query state SHALL update and be passed to InventoryTable for filtering

#### Scenario: JobDetailPage pieces section with search
- **WHEN** user types in the search field in JobDetailPage pieces section
- **THEN** the query state SHALL update and be passed to PiecesTable for filtering

#### Scenario: ClientDetailPage jobs section with search
- **WHEN** user types in the search field in ClientDetailPage jobs section
- **THEN** the query state SHALL update and be passed to ClientJobsDiscoveryTable for filtering

### Requirement: Table components accept query prop instead of managing search internally
Table components (ClientsTable, JobsTable, TransactionsTable, InventoryTable, PiecesTable, ClientJobsDiscoveryTable) SHALL accept an optional `query` prop (string) and remove internal `ListTableSearchField` and search state.

#### Scenario: ClientsTable with query prop
- **WHEN** ClientsTable receives a `query` prop
- **THEN** it SHALL filter rows using the query via `filterRowsBySearchQuery`

#### Scenario: ClientsTable without query prop
- **WHEN** ClientsTable does not receive a `query` prop
- **THEN** it SHALL display all rows without filtering

#### Scenario: JobsTable with query prop
- **WHEN** JobsTable receives a `query` prop
- **THEN** it SHALL filter rows using the query via `filterRowsBySearchQuery`

#### Scenario: TransactionsTable with query prop
- **WHEN** TransactionsTable receives a `query` prop
- **THEN** it SHALL filter rows using the query via `filterRowsBySearchQuery`

#### Scenario: InventoryTable with query prop
- **WHEN** InventoryTable receives a `query` prop
- **THEN** it SHALL filter rows using the query via `filterRowsBySearchQuery`

#### Scenario: PiecesTable with query prop
- **WHEN** PiecesTable receives a `query` prop
- **THEN** it SHALL filter rows using the query via `filterRowsBySearchQuery`

#### Scenario: PiecesTable without query prop
- **WHEN** PiecesTable does not receive a `query` prop
- **THEN** it SHALL display all rows without filtering

#### Scenario: ClientJobsDiscoveryTable with query prop
- **WHEN** ClientJobsDiscoveryTable receives a `query` prop
- **THEN** it SHALL filter rows using the query via `filterRowsBySearchQuery`

#### Scenario: ClientJobsDiscoveryTable without query prop
- **WHEN** ClientJobsDiscoveryTable does not receive a `query` prop
- **THEN** it SHALL display all rows without filtering
