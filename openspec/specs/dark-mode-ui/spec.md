## Purpose

Support a complete dark mode theme across the entire illo3d UI surface, toggled via the profile menu and persisted across sessions. Uses design token-based colors for consistency.

## Requirements

### Requirement: Dark mode applies to all layout and shell surfaces
The system SHALL render all layout surfaces with dark palette tokens when the user selects dark mode.

#### Scenario: Layout shell in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** the page background uses `--color-surface` dark variant (gray-950), header and breadcrumbs use `--color-surface-elevated` dark variant (gray-900)

#### Scenario: Header in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** the app header background, text, borders, and workbook action buttons use palette-derived dark token variants (`bg-surface-elevated`, `text-text`, `border-border`)

### Requirement: Dark mode applies to all page content surfaces
The system SHALL render all page-level cards, tables, empty states, and detail views with palette-derived dark tokens when the user selects dark mode.

#### Scenario: Dashboard cards in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all dashboard stat cards, expected benefit card, inventory alerts, recent list, and kanban columns/cards use palette-derived dark token variants

#### Scenario: Kanban job card pricing tone
- **WHEN** a kanban card displays a job price
- **THEN** prices greater than zero render in green (`--color-success`)
- **AND** prices of zero or less render in red (`--color-danger`)

#### Scenario: Tables in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all table containers, headers, rows, zebra striping (odd: gray-900, even: gray-800), borders, text, and search fields use palette-derived dark token variants

#### Scenario: Detail pages in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all entity detail cards, metric cards, field labels, and values use palette-derived dark token variants

#### Scenario: Empty states in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all empty state containers, borders, and text use palette-derived dark token variants

### Requirement: Dark mode applies to all interactive components
The system SHALL render all dialogs, popups, forms, dropdowns, buttons, and inputs with palette-derived dark tokens when the user selects dark mode.

#### Scenario: Dialogs in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all dialog panels, titles, messages, and action buttons use palette-derived dark token variants

#### Scenario: Forms and inputs in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all form labels, text inputs, textareas, selects, checkboxes, and disabled states use palette-derived dark token variants
- **AND** all text inputs, textareas, and selects have a dark background (`bg-surface-elevated`) with light text (`text-text`), not just dark borders

#### Scenario: Popups in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all create/edit popup panels, form fields, and action buttons use palette-derived dark token variants

#### Scenario: Dropdowns in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all status dropdowns and search result dropdowns use palette-derived dark token variants

#### Scenario: Profile menu dropdown in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** the profile menu panel, user info section, language selector buttons, theme toggle row, and sign-out button use palette-derived dark token variants
- **AND** inactive language buttons and the theme toggle row have a dark background (`bg-surface`)

#### Scenario: Buttons in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all secondary/outline buttons, hover states, and disabled states use palette-derived dark token variants

### Requirement: Hover state dark mappings follow exact prefix rules
The system SHALL map light-mode hover backgrounds to dark-mode hover backgrounds, not to static dark backgrounds.

#### Scenario: Hover background mapping
- **WHEN** a component uses `hover:bg-surface`
- **THEN** its dark variant is `dark:hover:bg-surface-elevated`, not `dark:bg-surface-elevated`

### Requirement: Dark mode applies to wizard and onboarding surfaces
The system SHALL render the setup wizard, welcome step, Google Drive step, and confirmation modal with palette-derived dark tokens when the user selects dark mode.

#### Scenario: Wizard in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** the wizard overlay, panel, selection cards, inputs, and buttons use palette-derived dark token variants

### Requirement: Semantic color surfaces adapt to dark mode
The system SHALL preserve the semantic meaning of all status badges, severity strips, inventory alerts, and connection banners while adapting their backgrounds and text for dark mode visibility.

#### Scenario: Status badges in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all success, warning, danger, info, and primary badges use palette-derived dark-appropriate background and text colors

#### Scenario: Inventory alerts in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all red, orange, and yellow inventory alert cards use palette-derived dark-appropriate background and text colors

### Requirement: Light mode appearance uses consistent palette
The system SHALL render all surfaces using the organized design token palette in light mode.

#### Scenario: Light mode uses token palette
- **WHEN** the user is in light mode (default)
- **THEN** all colors match the token palette defined in `src/styles/tokens.css` using original Tailwind colors (gray-100, white, gray-950, gray-900)

### Requirement: Theme preference persists across sessions
The system SHALL continue to persist the user's theme preference across browser sessions.

#### Scenario: Theme persistence
- **WHEN** the user selects dark mode and reloads the page
- **THEN** the app initializes in dark mode before React hydrates

### Requirement: Tables use consistent zebra striping
The system SHALL render all tables with consistent zebra striping using design tokens.

#### Scenario: Light mode zebra striping
- **WHEN** a table renders in light mode
- **THEN** odd rows use `bg-surface-elevated` (white), even rows use `bg-surface-alt` (gray-50)

#### Scenario: Dark mode zebra striping
- **WHEN** a table renders in dark mode
- **THEN** odd rows use `bg-surface-elevated` (gray-900), even rows use `bg-surface-alt` (gray-800)
