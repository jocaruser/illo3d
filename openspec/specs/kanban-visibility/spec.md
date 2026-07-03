# kanban-visibility Specification

## Purpose

Define the rules that determine which jobs appear on the kanban board based on status and effective due-date age, plus the `jobDueDate()` abstraction seam for future due-date field evolution.

## Requirements

### Requirement: Job effective due date is extracted via a dedicated utility

The system SHALL provide a `jobDueDate(job: Job): Date` function that returns the effective due date for a job. The function SHALL use `job.created_at` as the date source. This function SHALL be the single point of truth for all code that needs a job's due date, so that switching to a future dedicated `due_date` field requires changing only this function.

#### Scenario: Due date equals created_at

- **WHEN** `jobDueDate` is called with a job whose `created_at` is "2026-01-15"
- **THEN** it returns a `Date` representing January 15, 2026

#### Scenario: Due date is a Date object

- **WHEN** `jobDueDate` is called with any valid job
- **THEN** the return value is an instance of `Date`

### Requirement: Jobs can have their effective due date age computed in whole days

The system SHALL provide a `daysSinceDueDate(job: Job): number` function that returns the number of whole calendar days between the job's effective due date and the current date. The result SHALL be a non-negative integer. When the due date is in the future, the result SHALL be 0.

#### Scenario: Job created 6 days ago returns 6

- **WHEN** `daysSinceDueDate` is called on a job whose `created_at` is exactly 6 calendar days before today
- **THEN** the function returns 6

#### Scenario: Job created today returns 0

- **WHEN** `daysSinceDueDate` is called on a job whose `created_at` is today
- **THEN** the function returns 0

### Requirement: Stale completed jobs are hidden from kanban

The system SHALL provide a `shouldHideJobOnKanban(job: Job, staleDays?: number): boolean` function. The function SHALL return `true` when all of the following are true:
- The job's status is `paid` or `cancelled`
- The job is active (not archived, not deleted)
- `daysSinceDueDate(job)` is strictly greater than the effective stale threshold (defaulting to 5 when `staleDays` is `undefined` or absent)

The function SHALL return `false` for all other jobs.

#### Scenario: Paid job older than threshold is hidden

- **WHEN** `shouldHideJobOnKanban` is called with a `paid` job whose due date is 7 days ago and `staleDays` is 5
- **THEN** the function returns `true`

#### Scenario: Paid job within threshold is visible

- **WHEN** `shouldHideJobOnKanban` is called with a `paid` job whose due date is 3 days ago and `staleDays` is 5
- **THEN** the function returns `false`

#### Scenario: Paid job exactly at threshold is visible

- **WHEN** `shouldHideJobOnKanban` is called with a `paid` job whose due date is exactly 5 days ago and `staleDays` is 5
- **THEN** the function returns `false`

#### Scenario: Cancelled job older than threshold is hidden

- **WHEN** `shouldHideJobOnKanban` is called with a `cancelled` job whose due date is 10 days ago and `staleDays` is 5
- **THEN** the function returns `true`

#### Scenario: Delivered job is never hidden

- **WHEN** `shouldHideJobOnKanban` is called with a `delivered` job whose due date is 30 days ago
- **THEN** the function returns `false`

#### Scenario: Draft job is never hidden

- **WHEN** `shouldHideJobOnKanban` is called with a `draft` job whose due date is 30 days ago
- **THEN** the function returns `false`

#### Scenario: In-progress job is never hidden

- **WHEN** `shouldHideJobOnKanban` is called with an `in_progress` job whose due date is 30 days ago
- **THEN** the function returns `false`

#### Scenario: Archived job returns false

- **WHEN** `shouldHideJobOnKanban` is called with a `paid` job whose `archived` is "true"
- **THEN** the function returns `false`

#### Scenario: Deleted job returns false

- **WHEN** `shouldHideJobOnKanban` is called with a `cancelled` job whose `deleted` is "true"
- **THEN** the function returns `false`

#### Scenario: Default threshold is used when staleDays is undefined

- **WHEN** `shouldHideJobOnKanban` is called with a `paid` job 6 days old and `staleDays` is `undefined`
- **THEN** the function uses 5 as the threshold and returns `true`

#### Scenario: Default threshold is used when staleDays is absent

- **WHEN** `shouldHideJobOnKanban` is called with a `cancelled` job 6 days old and no `staleDays` argument
- **THEN** the function uses 5 as the threshold and returns `true`

#### Scenario: Custom threshold from metadata is respected

- **WHEN** `shouldHideJobOnKanban` is called with a `paid` job 4 days old and `staleDays` is 3
- **THEN** the function returns `true`

### Requirement: Stale threshold is configurable per shop

The system SHALL allow the stale threshold to be configured via `ShopMetadata.kanban.autoCardsHideAfterXDays`. When the `kanban` object or its `autoCardsHideAfterXDays` field is absent, the system SHALL default to 5 days. The field SHALL be an optional positive integer.

#### Scenario: Metadata with autoCardsHideAfterXDays set

- **WHEN** `illo3d.metadata.json` contains `"kanban": { "autoCardsHideAfterXDays": 7 }`
- **THEN** the kanban uses 7 days as the stale threshold

#### Scenario: Metadata without kanban section

- **WHEN** `illo3d.metadata.json` does not contain a `kanban` object
- **THEN** the kanban uses 5 days as the stale threshold

#### Scenario: Metadata with kanban but without autoCardsHideAfterXDays

- **WHEN** `illo3d.metadata.json` contains `"kanban": {}` (no `autoCardsHideAfterXDays`)
- **THEN** the kanban uses 5 days as the stale threshold

### Requirement: jobDueDateGradient uses the shared due-date utility

The existing `jobDueDateGradient` function SHALL call `jobDueDate()` instead of `new Date(createdAt)` directly, so that when the due date source changes, the gradient visual follows automatically.

#### Scenario: Gradient uses effective due date

- **WHEN** `jobDueDateGradient` is called with a job's `created_at`
- **THEN** the returned gradient is computed from the same effective due date as `jobDueDate`
