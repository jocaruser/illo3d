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

### Requirement: ListTableSearchField accessible label

The `ListTableSearchField` component SHALL use a visually hidden `<label>` element (e.g. `className="sr-only"`) associated to the input via `htmlFor` / `id` to provide the accessible name. A separate `aria-label` attribute on the same input SHALL NOT be used alongside an associated `<label>` element, as this creates a redundant accessible name source that may confuse assistive technology.

#### Scenario: Search field has associated label

- **WHEN** the search field renders
- **THEN** a `<label>` with `sr-only` styling is associated to the input via `htmlFor`
- **AND** no duplicate `aria-label` is present on that input

---

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

### Requirement: SectionHeading shared component for detail page sections

Detail pages that contain multiple named sections SHALL use a shared `SectionHeading` component for their `<h3>` section titles instead of repeating the heading markup inline. The component SHALL accept a `title` string prop and render a consistently styled heading using `text-lg font-semibold text-gray-800 dark:text-gray-200` with `mb-3`. Inline section headings using any other font-size (e.g. `text-xl`) for the same role SHALL NOT be used.

#### Scenario: Detail page uses SectionHeading

- **WHEN** a detail page renders a named section (e.g. "Materials", "Tags", "Notes", "Purchase Lots", "Consumption")
- **THEN** the section title is rendered via the `SectionHeading` component (or equivalent `h3` with the same classes)

#### Scenario: No oversized inline headings

- **WHEN** any section heading inside a detail page is inspected
- **THEN** it SHALL NOT carry `text-xl` or larger font-size classes for that heading role outside of the shared pattern

---

### Requirement: Three canonical page archetypes

The app SHALL use exactly three page archetypes. Every routed page SHALL conform to one of them:

1. **Dashboard** — a single page with stat cards, kanban, and summary lists. No back-navigation link.
2. **List** — a page with a `ListTablePageHeader` (title + search + actions) followed by a filterable table. The table SHALL always mount; an empty dataset SHALL show a single table row with a message (see requirement below), not a separate full-page empty card.
3. **Detail** — a page with a back-navigation link, a header block (either `EntityDetailPage` card or a widget grid for data-heavy entities), followed by zero or more named content sections.

#### Scenario: List page structure

- **WHEN** a list page renders (Clients, Jobs, Inventory, Transactions)
- **THEN** it SHALL contain exactly one `ListTablePageHeader` at the top and the list table below, with the table still rendered when row count is zero

#### Scenario: Detail page structure

- **WHEN** a detail page renders (ClientDetail, InventoryDetail, ExpenseTransactionDetail, JobDetail)
- **THEN** it SHALL begin with a back-navigation link, followed by a header block, followed by zero or more content sections

---

### Requirement: List and detail tables show empty data inside the table

For `ClientsTable`, `JobsTable`, `TransactionsTable`, `InventoryTable`, `PiecesTable`, `ClientJobsDiscoveryTable`, `JobMaterialsSummary`, `InventoryLotsTable`, `InventoryConsumptionTable`, and expense lot tables on transaction detail pages: when there are zero data rows (and for list tables, the collection itself is empty), the table SHALL still render column headers and SHALL render one `<tbody>` row with `colSpan` equal to the column count, centered text, and the domain-appropriate empty message. When the collection is non-empty but the search/filter yields no rows, that row SHALL show `listTable.noMatches` instead. List pages SHALL NOT substitute `EmptyState` in place of the table solely because the collection is empty.

#### Scenario: Empty clients list

- **WHEN** ClientsPage loads with zero clients
- **THEN** a table is visible and the body shows `clients.empty` inside a single spanned row

---

### Requirement: Detail page sections use uniform bottom spacing

All named content sections rendered inside a detail page SHALL apply `mb-8` as their outermost bottom margin unless a parent uses `space-y-8` with equivalent gap. No section SHALL apply a top border (`border-t`), top margin (`mt-*`), or top padding (`pt-*`) as a decorative separator between itself and the preceding section solely to imitate an `<hr>`.

#### Scenario: Consecutive sections have equal gaps

- **WHEN** a detail page renders two or more consecutive content sections using margin-based spacing
- **THEN** the visual gap between them SHALL be uniform (e.g. `mb-8` between blocks)

#### Scenario: No standalone horizontal separator

- **WHEN** any content section is inspected
- **THEN** it SHALL NOT include a `border-t` class whose sole purpose is a horizontal rule between sections

---

### Requirement: Detail page header block uses mb-8 bottom spacing

The header block of a detail page (whether an `EntityDetailPage` card or `JobDetailPage` widget grid wrapper) SHALL apply `mb-8` below it so the gap to the first content section matches inter-section rhythm.

#### Scenario: Widget-grid header bottom margin

- **WHEN** `JobDetailPage` renders its widget grid wrapper
- **THEN** the wrapper SHALL have `mb-8`

---

### Requirement: Detail page not-found state uses NotFoundCard

When a detail page cannot resolve the route id to an active entity, the page SHALL render `NotFoundCard` with an appropriate message and back-navigation link. Duplicated inline not-found card markup SHALL NOT be used.

#### Scenario: Job not found uses NotFoundCard

- **WHEN** `JobDetailPage` is visited with an id that matches no active job
- **THEN** `NotFoundCard` is rendered with a back link to `/jobs`

#### Scenario: Unknown entity shows NotFoundCard

- **WHEN** the workbook is connected and no active entity matches the route id
- **THEN** the `NotFoundCard` is shown with an appropriate message and a link back to the list page

---

### Requirement: Inventory detail always shows lots and consumption tables

`InventoryDetailPage` SHALL always render both `InventoryLotsTable` and `InventoryConsumptionTable` below the header when the inventory item exists. Each table handles its own empty tbody row per the empty-data requirement.

#### Scenario: No lots and no consumption

- **WHEN** an inventory item has no lots and no consumption rows
- **THEN** both section headings and tables still render, each with an empty-data row

---

### Requirement: Primary button visual consistency via shared CSS class

Primary action buttons (submit / create / confirm type) SHALL share a consistent visual style. The project SHALL define a `.btn-primary` utility in `@layer components` using `@apply` so that the full class set is not repeated inline across components. Individual usages MAY add modifier classes (e.g. `disabled:opacity-50`) on top of `.btn-primary`.

#### Scenario: Primary buttons share class

- **WHEN** any primary call-to-action button is inspected
- **THEN** its `className` includes `btn-primary` rather than the full expanded Tailwind token list

---

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
