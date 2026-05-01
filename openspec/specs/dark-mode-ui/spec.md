## Purpose

Support a complete dark mode theme across the entire illo3d UI surface, toggled via the profile menu and persisted across sessions. Light mode appearance must remain pixel-identical to the pre-change state.

## Requirements

### Requirement: Dark mode applies to all layout and shell surfaces
The system SHALL render all layout surfaces with appropriate dark colors when the user selects dark mode.

#### Scenario: Layout shell in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** the page background, header, breadcrumbs, and mobile menu use dark color variants

#### Scenario: Header in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** the app header background, text, borders, and workbook action buttons use dark color variants

### Requirement: Dark mode applies to all page content surfaces
The system SHALL render all page-level cards, tables, empty states, and detail views with appropriate dark colors when the user selects dark mode.

#### Scenario: Dashboard cards in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all dashboard stat cards, expected benefit card, inventory alerts, recent list, and kanban columns/cards use dark color variants

#### Scenario: Kanban job card pricing tone
- **WHEN** a kanban card displays a job price
- **THEN** prices greater than zero render in green (`text-green-600` / `dark:text-green-400`)
- **AND** prices of zero or less render in red (`text-red-600` / `dark:text-red-400`)

#### Scenario: Tables in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all table containers, headers, rows, zebra striping, borders, text, and search fields use dark color variants

#### Scenario: Detail pages in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all entity detail cards, metric cards, field labels, and values use dark color variants

#### Scenario: Empty states in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all empty state containers, borders, and text use dark color variants

### Requirement: Dark mode applies to all interactive components
The system SHALL render all dialogs, popups, forms, dropdowns, buttons, and inputs with appropriate dark colors when the user selects dark mode.

#### Scenario: Dialogs in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all dialog panels, titles, messages, and action buttons use dark color variants

#### Scenario: Forms and inputs in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all form labels, text inputs, textareas, selects, checkboxes, and disabled states use dark color variants
- **AND** all text inputs, textareas, and selects have a dark background (`dark:bg-gray-800`) with light text (`dark:text-gray-100`), not just dark borders

#### Scenario: Popups in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all create/edit popup panels, form fields, and action buttons use dark color variants

#### Scenario: Dropdowns in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all status dropdowns and search result dropdowns use dark color variants

#### Scenario: Profile menu dropdown in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** the profile menu panel, user info section, language selector buttons, theme toggle row, and sign-out button use dark color variants
- **AND** inactive language buttons and the theme toggle row have dark backgrounds (`dark:bg-gray-700`)

#### Scenario: Buttons in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all secondary/outline buttons, hover states, and disabled states use dark color variants

### Requirement: Hover state dark mappings follow exact prefix rules
The system SHALL map light-mode hover backgrounds to dark-mode hover backgrounds, not to static dark backgrounds.

#### Scenario: Hover background mapping
- **WHEN** a component uses `hover:bg-gray-50`
- **THEN** its dark variant is `dark:hover:bg-gray-800`, not `dark:bg-gray-800`
- **WHEN** a component uses `hover:bg-gray-100`
- **THEN** its dark variant is `dark:hover:bg-gray-800`, not `dark:bg-gray-800`
- **WHEN** a component uses `hover:bg-gray-200`
- **THEN** its dark variant is `dark:hover:bg-gray-700`, not `dark:bg-gray-700`

### Requirement: Dark mode applies to wizard and onboarding surfaces
The system SHALL render the setup wizard, welcome step, Google Drive step, and confirmation modal with appropriate dark colors when the user selects dark mode.

#### Scenario: Wizard in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** the wizard overlay, panel, selection cards, inputs, and buttons use dark color variants

### Requirement: Semantic color surfaces adapt to dark mode
The system SHALL preserve the semantic meaning of all status badges, severity strips, inventory alerts, and connection banners while adapting their backgrounds and text for dark mode visibility.

#### Scenario: Status badges in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all success, warning, danger, info, and primary badges use dark-appropriate background and text colors

#### Scenario: Inventory alerts in dark mode
- **WHEN** the user toggles to dark mode
- **THEN** all red, orange, and yellow inventory alert cards use dark-appropriate background and text colors

### Requirement: Light mode appearance is unchanged
The system SHALL render all surfaces identically to the pre-change light mode appearance.

#### Scenario: Light mode unchanged
- **WHEN** the user is in light mode (default)
- **THEN** all colors match the original hardcoded light values exactly

### Requirement: Theme preference persists across sessions
The system SHALL continue to persist the user's theme preference across browser sessions.

#### Scenario: Theme persistence
- **WHEN** the user selects dark mode and reloads the page
- **THEN** the app initializes in dark mode before React hydrates
