# step-grid Specification

## Purpose

The StepGrid component provides a responsive CSS grid layout for arranging StepCards. It adapts columns based on viewport width, supports custom column overrides, and can display an optional label above the grid. The component is purely presentational — it does not own status logic or data.

## Requirements

### Requirement: StepGrid renders StepCards in a responsive CSS grid

The StepGrid component SHALL render its children (typically StepCard components) in a CSS grid layout. The grid SHALL adapt columns based on viewport width: 2 columns below 640px, 3 columns at 640–768px, 4 columns above 768px.

#### Scenario: Default responsive grid

- **WHEN** a StepGrid renders with 11 StepCard children
- **THEN** the children are arranged in a CSS grid
- **AND** at < 640px viewport width, exactly 2 columns are visible
- **AND** at 640–768px, exactly 3 columns are visible
- **AND** at > 768px, exactly 4 columns are visible

#### Scenario: Custom column overrides

- **WHEN** a StepGrid is rendered with `columns={{ default: 1, md: 2 }}`
- **THEN** the grid uses 1 column by default and 2 at the `md` breakpoint

#### Scenario: Optional label above grid

- **WHEN** a StepGrid is rendered with a `label` prop
- **THEN** the label text is visible above the grid, styled as a section header

#### Scenario: Empty grid renders without error

- **WHEN** a StepGrid is rendered with zero children
- **THEN** the grid container renders with no visible cards and no layout breakage
