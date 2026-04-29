## Purpose

Define the profile menu dropdown component in the navbar containing user-related actions and settings.

## Requirements

### Requirement: Profile menu accessible from navbar
The system SHALL display a profile menu button in the navbar when the user is authenticated.

#### Scenario: Authenticated user sees profile menu
- **GIVEN** user is authenticated
- **WHEN** user views the navbar
- **THEN** a profile menu button is visible

#### Scenario: Unauthenticated user does not see profile menu
- **GIVEN** user is not authenticated
- **WHEN** user views the navbar
- **THEN** no profile menu button is displayed

### Requirement: Profile menu opens dropdown on click
The system SHALL display a dropdown menu when the profile button is clicked.

#### Scenario: User opens profile menu
- **GIVEN** user is authenticated
- **WHEN** user clicks the profile menu button
- **THEN** a dropdown menu appears with user information and settings

#### Scenario: User closes profile menu
- **GIVEN** the profile menu dropdown is open
- **WHEN** user clicks outside the menu or presses Escape
- **THEN** the dropdown closes

### Requirement: Profile menu contains user information
The system SHALL display the user's name and avatar in the profile menu dropdown.

#### Scenario: User views profile menu
- **GIVEN** user is authenticated with name "John Doe" and avatar
- **WHEN** user opens the profile menu
- **THEN** "John Doe" and the user's avatar are displayed

### Requirement: Profile menu contains language selector
The system SHALL provide buttons to switch between English and Spanish in the profile menu.

#### Scenario: User switches language
- **GIVEN** profile menu is open and current language is English
- **WHEN** user clicks the "Español" button
- **THEN** the application language changes to Spanish
- **AND** the UI updates to reflect Spanish translations

#### Scenario: Current language is indicated
- **GIVEN** profile menu is open
- **WHEN** user views the language selector
- **THEN** the current language button appears disabled or highlighted

### Requirement: Profile menu contains theme toggle
The system SHALL provide a toggle to switch between light and dark themes in the profile menu.

#### Scenario: User toggles dark mode
- **GIVEN** profile menu is open and current theme is light
- **WHEN** user clicks the dark mode toggle
- **THEN** the application theme changes to dark mode
- **AND** the UI updates with dark color scheme

#### Scenario: User toggles light mode
- **GIVEN** profile menu is open and current theme is dark
- **WHEN** user clicks the dark mode toggle
- **THEN** the application theme changes to light mode
- **AND** the UI updates with light color scheme

### Requirement: Profile menu contains sign out option
The system SHALL provide a sign out option in the profile menu.

#### Scenario: User signs out from profile menu
- **GIVEN** profile menu is open
- **WHEN** user clicks the sign out option
- **THEN** the user is signed out
- **AND** the profile menu closes
