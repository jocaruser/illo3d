## ADDED Requirements

### Requirement: Blocking overlay prevents interaction during save

The system SHALL display a full-screen blocking overlay during workbook save operations. The overlay SHALL cover the entire viewport with an opaque backdrop and prevent all user interaction with the application. The overlay SHALL be dismissible only after the save completes or fails.

#### Scenario: Overlay appears when save starts
- **WHEN** the user triggers Save
- **THEN** a full-screen overlay appears immediately
- **AND** all application UI behind the overlay is non-interactive
- **AND** a progress card is centered on screen

#### Scenario: Overlay shows progress during save
- **WHEN** the save operation is in progress
- **THEN** the progress card shows "Saving workbook…"
- **AND** the current sheet being written is displayed
- **AND** a progress bar fills proportionally (e.g., "3/10 sheets")
- **AND** the progress updates as each sheet completes

#### Scenario: Overlay dismisses on save success
- **WHEN** all sheets have been written successfully
- **THEN** the overlay dismisses automatically
- **AND** a success toast appears (non-blocking)
- **AND** the workbook dirty flag is set to false

#### Scenario: Overlay transitions to error on save failure
- **WHEN** a sheet write fails during save
- **THEN** the overlay dismisses
- **AND** an error toast appears with the failure message
- **AND** the error toast includes a Retry action button
- **AND** the dirty flag remains true

#### Scenario: Overlay supports dark mode
- **WHEN** the theme is set to dark
- **THEN** the overlay backdrop and progress card adapt to dark colors
- **AND** colors match the app's existing dark palette

### Requirement: Overlay uses OperationToastStore for state

The blocking overlay SHALL read progress state from OperationToastStore. The store SHALL include a `blocking` flag to differentiate between toast and overlay rendering modes.

#### Scenario: Store tracks blocking state for save
- **WHEN** the save operation starts
- **THEN** OperationToastStore sets `blocking: true`
- **AND** progress state (current, total, sheetName) is tracked as before

#### Scenario: Store clears blocking state on completion
- **WHEN** the save operation completes (success or failure)
- **THEN** OperationToastStore sets `blocking: false`
- **AND** the overlay dismisses

## MODIFIED Requirements

No existing requirements from other capabilities are modified in this spec.

## REMOVED Requirements

No requirements are removed in this spec.
