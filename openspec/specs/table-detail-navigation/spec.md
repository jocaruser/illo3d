# table-detail-navigation Specification

## Purpose

Normative UX rule for data tables: every table that lists domain entities must expose a visible `id` column and place the primary detail/view link inside that column, keeping descriptive columns as plain text.

## Requirements

### Requirement: Every data table exposes a visible id column

For every in-app data table that renders a list of domain entities, the system SHALL render a dedicated `id` column as a visible table column. The `id` column SHALL display the entity's stable identifier (for example `job.id`, `client.id`, `inventory.id`). The `id` column SHALL be positioned as the first data column (before descriptive or status columns) unless an existing product convention places a narrower status badge before it. Tables that already render a visible `id` column SHALL remain unchanged.

#### Scenario: Jobs table shows id column

- **WHEN** the authenticated user views `/jobs` with at least one job row
- **THEN** each row displays the job `id` in a dedicated column before the description column

#### Scenario: Inventory table shows id column

- **WHEN** the authenticated user views `/inventory` with at least one inventory item
- **THEN** each row displays the inventory item `id` in a dedicated column before the name column

#### Scenario: Clients table shows id column

- **WHEN** the authenticated user views `/clients` with at least one client
- **THEN** each row displays the client `id` in a dedicated column before the name column

#### Scenario: Client embedded jobs table shows id column

- **WHEN** the authenticated user views `/clients/:clientId` and the client has at least one job
- **THEN** each row in the embedded jobs table displays the job `id` in a dedicated column before the description column

#### Scenario: Inventory detail lots table shows id column

- **WHEN** the authenticated user views `/inventory/:inventoryId` and the item has at least one purchase lot
- **THEN** each lot row displays the lot `id` in a dedicated column before the date column

#### Scenario: Inventory detail consumption table shows id column

- **WHEN** the authenticated user views `/inventory/:inventoryId` and the item has consumption records
- **THEN** each consumption row displays the piece or job `id` in a dedicated column before the piece name column

#### Scenario: Expense transaction detail lots table shows id column

- **WHEN** the authenticated user views an expense transaction with linked inventory lots
- **THEN** each linked lot row displays the inventory `id` in a dedicated column before the inventory name column

### Requirement: Primary detail link lives in the id column

For every data table affected by this capability, the system SHALL place the primary navigation link to the row's detail page inside the `id` column cell. The link SHALL wrap the displayed `id` value. The column that previously held the primary detail link (for example description, name, transaction, or job) SHALL render as plain text without a link. Secondary links that navigate to a different entity type (for example a job row linking to its client) SHALL remain in their respective columns.

#### Scenario: Jobs table id links to job detail

- **WHEN** the user views the jobs list
- **THEN** clicking the `id` cell navigates to `/jobs/:jobId`
- **AND** the description cell is plain text without a link

#### Scenario: Inventory table id links to inventory detail

- **WHEN** the user views the inventory list
- **THEN** clicking the `id` cell navigates to `/inventory/:inventoryId`
- **AND** the name cell is plain text without a link

#### Scenario: Clients table id links to client detail

- **WHEN** the user views the clients list
- **THEN** clicking the `id` cell navigates to `/clients/:clientId`
- **AND** the name cell is plain text without a link

#### Scenario: Client embedded jobs id links to job detail

- **WHEN** the user views a client detail page with embedded jobs
- **THEN** clicking the job `id` cell in the embedded table navigates to `/jobs/:jobId`
- **AND** the description cell is plain text without a link

#### Scenario: Inventory detail lots id links to transaction detail

- **WHEN** the user views an inventory detail page with purchase lots
- **THEN** clicking the lot `id` cell navigates to `/transactions/:transactionId`
- **AND** the transaction column is plain text without a link

#### Scenario: Inventory detail consumption id links to job detail

- **WHEN** the user views an inventory detail page with consumption records
- **THEN** clicking the job `id` cell navigates to `/jobs/:jobId`
- **AND** the job description column is plain text without a link

#### Scenario: Expense transaction detail lots id links to inventory detail

- **WHEN** the user views an expense transaction with linked inventory lots
- **THEN** clicking the inventory `id` cell navigates to `/inventory/:inventoryId`
- **AND** the inventory name column is plain text without a link

### Requirement: Id column remains visible on narrow viewports

On narrow viewports, the system SHALL hide non-essential columns before hiding the `id` column, because the `id` column carries the primary navigation link. The `id` column SHALL use a compact width so that horizontal overflow is minimized. If a table must hide the `id` column on the smallest breakpoint due to severe space constraints, the system SHALL ensure an alternative primary navigation affordance (for example an actions-column "View" button) is visible.

#### Scenario: Narrow viewport keeps id column visible

- **WHEN** the viewport width is below the chosen `md` breakpoint
- **AND** the table defines non-essential columns such as creation date or notes
- **THEN** the `id` column remains visible while at least one non-essential column is hidden
