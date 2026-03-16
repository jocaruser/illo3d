# expense-creation Specification

## Purpose

UI and flow for creating expenses. Users can add expenses via a popup form from the transactions and expenses pages. Successful creation redirects to the expenses page.

## Requirements

### Requirement: Expenses page displays expense table

The system SHALL provide an `/expenses` route that displays a table of all expenses from the expenses sheet. The table SHALL show: date, category, amount, notes.

#### Scenario: Expenses table renders with data
- **WHEN** user navigates to /expenses
- **THEN** table displays all expenses sorted by date descending

#### Scenario: Empty state when no expenses
- **WHEN** user navigates to /expenses
- **AND** no expenses exist
- **THEN** table shows empty state message

### Requirement: CreateExpensePopup is a reusable modal form

The system SHALL provide a CreateExpensePopup component that renders a modal with a form. The form SHALL collect: date (YYYY-MM-DD), category (enum: filament, consumable, electric, investment, maintenance, other), amount (number), notes (optional). The popup SHALL be closable and usable from multiple pages.

#### Scenario: Popup opens and shows form fields
- **WHEN** user triggers the popup (e.g. clicks "Add expense")
- **THEN** modal displays with date, category, amount, notes inputs
- **AND** category is a select with the six options

#### Scenario: Popup can be closed without submitting
- **WHEN** user opens the popup
- **THEN** user can close it via overlay click or close button
- **AND** no expense is created

### Requirement: Add expense button on transactions and expenses pages

The system SHALL display an "Add expense" button on the /transactions page and on the /expenses page. Clicking the button SHALL open the CreateExpensePopup.

#### Scenario: Button on transactions page
- **WHEN** user views /transactions
- **THEN** "Add expense" button is visible
- **AND** clicking it opens CreateExpensePopup

#### Scenario: Button on expenses page
- **WHEN** user views /expenses
- **THEN** "Add expense" button is visible
- **AND** clicking it opens CreateExpensePopup

### Requirement: Form validation before submit

The system SHALL validate the expense form before submission. Date SHALL be required and in YYYY-MM-DD format. Category SHALL be required. Amount SHALL be required and MUST be greater than zero. Notes MAY be empty.

#### Scenario: Validation rejects empty required fields
- **WHEN** user submits with missing date, category, or amount
- **THEN** validation errors are shown
- **AND** no API call is made

#### Scenario: Validation rejects zero or negative amount
- **WHEN** user submits with amount <= 0
- **THEN** validation error is shown for amount
- **AND** no expense is created

### Requirement: Successful submit redirects to expenses

The system SHALL redirect the user to /expenses after a successful expense creation. The popup SHALL close and the new expense SHALL appear in the expenses table.

#### Scenario: Redirect after success
- **WHEN** user submits valid expense form
- **AND** creation succeeds
- **THEN** popup closes
- **AND** user is navigated to /expenses
- **AND** the new expense appears in the table

### Requirement: Expense creation UI strings support i18n

All user-facing strings in the expense creation flow (form labels, buttons, validation messages, table headers) SHALL use i18next for translation support.

#### Scenario: Form labels are translatable
- **WHEN** CreateExpensePopup renders
- **THEN** field labels and buttons come from i18n keys
