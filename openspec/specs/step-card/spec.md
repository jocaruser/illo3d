# step-card Specification

## Purpose

The StepCard component provides a reusable atomic card with a fixed visual template: icon on the left with status-colored background, label to the right, and optional detail line. The card's background and icon colors are driven by a generic status config map, allowing it to be reused across contexts (migration wizard, save preview) without modification.

## Requirements

### Requirement: StepCard renders as a fixed template with icon, label, and status

The StepCard component SHALL render a fixed visual template: an icon on the left with status-colored background, a label to the right, and an optional detail line below the label. The card's background and icon colors SHALL be driven by a status config map, with no hardcoded status values in the component.

#### Scenario: Default card with icon and label

- **WHEN** a StepCard is rendered with an `icon` and `label`
- **THEN** the icon is visible inside a rounded container on the left
- **AND** the label text is visible to the right of the icon

#### Scenario: Card shows optional detail line

- **WHEN** a StepCard is rendered with a non-empty `detail` prop
- **THEN** the detail text is visible below the label in smaller, muted styling

#### Scenario: Card omits detail when not provided

- **WHEN** a StepCard is rendered without a `detail` prop
- **THEN** no detail element is rendered in the DOM

#### Scenario: Card background matches status config

- **WHEN** a StepCard is rendered with `status="pending"` and a config where `pending.bg = "bg-gray-100"`
- **THEN** the card has the `bg-gray-100` Tailwind class applied

#### Scenario: Icon background matches status config

- **WHEN** a StepCard is rendered with `status="running"` and a config where `running.iconBg = "bg-blue-500"`
- **THEN** the icon container has the `bg-blue-500` Tailwind class

#### Scenario: Check icon overrides entity icon on done status

- **WHEN** a StepCard is rendered with `status="done"` and `showCheckIcon = true` in the config
- **THEN** the icon container shows a checkmark icon instead of the entity's icon

#### Scenario: Pulse animation for running status

- **WHEN** a StepCard is rendered with a status config that has `pulse: true`
- **THEN** the card SHALL have the `animate-pulse` CSS class

### Requirement: StepCard accepts a generic status config

The StepCard SHALL NOT know about specific status names. It SHALL accept a `statusConfig` prop that maps arbitrary status strings to their visual properties (background, text, icon classes). It SHALL accept a `status` string prop that selects which entry in the config to use.

#### Scenario: Custom status values render correctly

- **WHEN** a StepCard is rendered with `status="archived"` and a config containing `{ archived: { bg: "bg-yellow-100", iconBg: "bg-yellow-400", ... } }`
- **THEN** the card uses the yellow styling from the config

### Requirement: StepCard passes accessibility requirements

#### Scenario: Card has accessible name

- **WHEN** a StepCard renders
- **THEN** it SHALL have `aria-label` or a visible label that screen readers can identify
