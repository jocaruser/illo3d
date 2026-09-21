# Table columns and viewport tiers (PR136-S07)

Per-table column order and **Viewport** values for the staging baseline
documented in the implementation plan.
**Small+**, **Medium+**, and **Wide+** map to `sm`, `md`, and `lg` breakpoints.

## Jobs list (`JobsTable.tsx`)

| # | Column | Viewport |
|---|--------|----------|
| 1 | Id | Always |
| 2 | Description | Always |
| 3 | Client | Medium+ |
| 4 | Status | Always |
| 5 | Total | Wide+ |
| 6 | Due date | Wide+ |
| 7 | Created | Wide+ |
| 8 | Actions | Always |

## Clients list (`ClientsTable.tsx`)

| # | Column | Viewport |
|---|--------|----------|
| 1 | Id | Always |
| 2 | Name | Always |
| 3 | Email | Always |
| 4 | Phone | Medium+ |
| 5 | Notes | Always |
| 6 | Created | Wide+ |
| 7 | Actions | Always |

## Inventory list (`InventoryTable.tsx`)

| # | Column | Viewport |
|---|--------|----------|
| 1 | Id | Always |
| 2 | Name | Always |
| 3 | Type | Small+ |
| 4 | Quantity | Always |
| 5 | Avg unit cost | Always |
| 6 | Created | Always |

## Transactions list (`TransactionsTable.tsx`)

| # | Column | Viewport |
|---|--------|----------|
| 1 | Id | Always |
| 2 | Date | Always |
| 3 | Type | Small+ |
| 4 | Amount | Always |
| 5 | Category | Medium+ |
| 6 | Concept | Wide+ |
| 7 | Client | Medium+ |

## Client detail jobs (`ClientJobsTable.tsx`)

| # | Column | Viewport |
|---|--------|----------|
| 1 | Id | Always |
| 2 | Description | Always |
| 3 | Status | Always |
| 4 | Due date | Medium+ |
| 5 | Created | Wide+ |
| 6 | Actions | Always |

## Job detail pieces (`PiecesTable.tsx`)

| # | Column | Viewport |
|---|--------|----------|
| 1 | Expand | Always |
| 2 | Id | Always |
| 3 | Name | Always |
| 4 | Units | Always |
| 5 | Price per unit | Always |
| 6 | Line total | Medium+ |
| 7 | Benefit | Medium+ |
| 8 | Status | Always |
| 9 | Created | Wide+ |
