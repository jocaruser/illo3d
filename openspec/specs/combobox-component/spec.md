# Combobox Component

## Purpose

Provides a reusable searchable combobox (input + listbox) for item selection with keyboard navigation, controlled value, creatable mode, disabled state, empty states, and consistent Tailwind dark mode styling.

## Requirements

### Requirement: Combobox renders searchable input with dropdown

The Combobox component SHALL render a text input with `role="combobox"` and a dropdown list with `role="listbox"`.

#### Scenario: Basic rendering
- **WHEN** Combobox is rendered with items
- **THEN** an `<input type="text">` with `role="combobox"` SHALL be rendered
- **AND** a dropdown list with `role="listbox"` SHALL appear when input is focused or has text

#### Scenario: Search filters items
- **WHEN** user types "fil" in the search input
- **THEN** the listbox SHALL only show items whose label contains "fil" (case-insensitive)

### Requirement: Combobox supports keyboard navigation

The Combobox component SHALL support Arrow keys for list navigation and Enter for selection.

#### Scenario: Arrow down opens and navigates
- **WHEN** user presses `ArrowDown` with empty input
- **THEN** the listbox SHALL open and highlight the first item

#### Scenario: Arrow up navigates
- **WHEN** listbox is open and user presses `ArrowUp`
- **THEN** the highlighted item SHALL move up one position (wrapping to last at top)

#### Scenario: Enter selects highlighted item
- **WHEN** listbox is open, an item is highlighted, and user presses `Enter`
- **THEN** `onChange` SHALL be called with the selected item's key
- **AND** the listbox SHALL close

#### Scenario: Escape closes listbox
- **WHEN** listbox is open and user presses `Escape`
- **THEN** the listbox SHALL close without selecting an item

### Requirement: Combobox supports controlled value

The Combobox component SHALL support controlled value via `value` and `onChange` props.

#### Scenario: Value selection
- **WHEN** user selects an item from the dropdown
- **THEN** `onChange` SHALL be called with the selected item's key
- **AND** the input SHALL display the selected item's label

#### Scenario: Clearing selection
- **WHEN** `value` prop changes to empty
- **THEN** the input SHALL display empty string

#### Scenario: Editing clears displayed label
- **WHEN** user is typing in the input (dropdown open)
- **THEN** the input SHALL display the current query text, not the selected item's label
- **AND** when user clears all query text, the input SHALL display empty string (placeholder)
- **AND** after blur (dropdown closed), the input SHALL display the selected item's label

### Requirement: Combobox supports disabled state

The Combobox component SHALL support a `disabled` prop that disables interaction.

#### Scenario: Disabled combobox
- **WHEN** `disabled` prop is true
- **THEN** the input SHALL have the `disabled` attribute
- **AND** the listbox SHALL NOT open on focus or click

### Requirement: Combobox shows empty state messages

The Combobox component SHALL show appropriate messages when no items match the search.

#### Scenario: No items match search
- **WHEN** user types text that matches no items
- **THEN** the listbox SHALL show "No matching items" message (i18n key: `combobox.noMatch`)

#### Scenario: Items list is empty
- **WHEN** Combobox is rendered with empty items array
- **THEN** the listbox SHALL show "No items available" message (i18n key: `combobox.noItems`)

### Requirement: Combobox supports optional creatable mode

The Combobox component SHALL support a `creatable` prop that allows creating new items.

#### Scenario: Creatable mode with no match
- **WHEN** `creatable` is true, user types "new item" that matches no existing items
- **THEN** the listbox SHALL show a "Create 'new item'" option

#### Scenario: Create new item
- **WHEN** user selects the "Create" option
- **THEN** `onCreateItem` SHALL be called with the input text

### Requirement: Combobox user-facing strings use i18n

All user-visible strings in the Combobox component SHALL use i18next keys so they are translatable into all supported locales. This includes: search placeholder (`combobox.searchPlaceholder`), listbox accessible label (`combobox.ariaLabel`), empty-items message (`combobox.noItems`), no-match message (`combobox.noMatch`), and create-option label (`combobox.create`). Hard-coded English strings SHALL NOT be used for any of these surfaces.

#### Scenario: Combobox renders Spanish strings

- **WHEN** the UI locale is Spanish
- **THEN** the search placeholder, empty messages, and create label all show Spanish translations from the `combobox.*` namespace

---

### Requirement: Combobox has consistent styling

The Combobox component SHALL use consistent Tailwind classes matching the app's design system.

#### Scenario: Dark mode support
- **WHEN** app is in dark mode
- **THEN** Combobox input and listbox SHALL have dark mode classes (`dark:bg-gray-800`, `dark:bg-gray-900`, etc.)

#### Scenario: Highlighted item styling
- **WHEN** an item is highlighted via keyboard or mouse
- **THEN** the item SHALL have highlight classes (`bg-blue-50 dark:bg-blue-950`)
