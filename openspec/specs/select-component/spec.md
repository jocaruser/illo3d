# Select Component

## Purpose

Provides a reusable native `<select>` wrapper for short lists (≤8 items) with controlled value, disabled state, placeholder support, and consistent Tailwind dark mode styling. Native `<select>` is used for semantic correctness and mobile picker UX.

## Requirements

### Requirement: Select renders native select element

The Select component SHALL render a native `<select>` element for semantic correctness and native mobile picker support.

#### Scenario: Basic rendering
- **WHEN** Select is rendered with items and a value
- **THEN** a `<select>` element SHALL be rendered with `<option>` elements for each item

#### Scenario: Short list rendering
- **WHEN** Select is rendered with 3 items (e.g., piece statuses)
- **THEN** all 3 items SHALL be rendered as `<option>` elements

### Requirement: Select supports controlled value

The Select component SHALL support controlled value via `value` and `onChange` props.

#### Scenario: Value selection
- **WHEN** user selects an option from the dropdown
- **THEN** `onChange` SHALL be called with the selected item's key

#### Scenario: Controlled value matches item
- **WHEN** `value` prop matches an item's key
- **THEN** the corresponding `<option>` SHALL have `selected` attribute

### Requirement: Select supports disabled state

The Select component SHALL support a `disabled` prop that disables interaction.

#### Scenario: Disabled select
- **WHEN** `disabled` prop is true
- **THEN** the `<select>` element SHALL have the `disabled` attribute

### Requirement: Select shows placeholder for empty value

The Select component SHALL show a placeholder option when `value` is empty and `placeholder` prop is provided.

#### Scenario: Placeholder rendering
- **WHEN** `value` is empty and `placeholder` is "Select a status"
- **THEN** first `<option>` SHALL have empty value and display "Select a status"

### Requirement: Select uses item count threshold

The Select component SHALL be suitable for lists with 8 or fewer items (native picker UX).

#### Scenario: Appropriate use case
- **WHEN** rendering a status dropdown with 5 items
- **THEN** Select component SHALL render without search functionality

### Requirement: Select has consistent styling

The Select component SHALL use consistent Tailwind classes matching the app's design system.

#### Scenario: Dark mode support
- **WHEN** app is in dark mode
- **THEN** Select SHALL have dark mode classes (`dark:bg-gray-800`, `dark:text-gray-100`, etc.)
