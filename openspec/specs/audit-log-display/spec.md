## ADDED Requirements

### Requirement: Relative time utility exists

The system SHALL provide a `formatRelativeTime()` utility function that converts an ISO-8601 timestamp into a human-readable relative time string with an absolute fallback string.

#### Scenario: Recent entry

- **WHEN** `formatRelativeTime('2026-07-09T14:30:00.000Z')` is called at 14:35 UTC
- **THEN** it returns `{ text: '5 minutes ago', absolute: 'Jul 9, 2026, 2:30 PM' }`

#### Scenario: Entry from months ago

- **WHEN** `formatRelativeTime('2026-01-15T09:00:00.000Z')` is called in July 2026
- **THEN** it returns `{ text: '6 months ago', absolute: 'Jan 15, 2026, 9:00 AM' }`

#### Scenario: Invalid timestamp

- **WHEN** `formatRelativeTime('not-a-date')` is called
- **THEN** it returns `{ text: 'not-a-date', absolute: 'not-a-date' }`

### Requirement: Relative time component exists

The system SHALL provide a `<RelativeTime>` React component that renders a semantic `<time>` element with a relative text display and an absolute timestamp tooltip.

#### Scenario: Component renders

- **WHEN** `<RelativeTime timestamp="2026-01-15T09:00:00.000Z" />` is rendered
- **THEN** the output is `<time dateTime="2026-01-15T09:00:00.000Z" title="Jan 15, 2026, 9:00 AM">6 months ago</time>`

#### Scenario: Invalid timestamp fallback

- **WHEN** `<RelativeTime timestamp="invalid" />` is rendered
- **THEN** the output displays the raw string "invalid" with no tooltip enhancement
