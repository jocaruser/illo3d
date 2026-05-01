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

### Requirement: Profile menu trigger shows avatar only
The system SHALL display a circular avatar button as the profile menu trigger when the user is authenticated. The trigger SHALL NOT display the user's name, email, or a chevron icon.

#### Scenario: Authenticated user sees avatar-only trigger
- **GIVEN** user is authenticated
- **WHEN** user views the navbar
- **THEN** a circular avatar button is visible
- **AND** the user's name and chevron are not visible in the navbar

### Requirement: Profile menu shows backend-aware identity section
The system SHALL display an identity section in the dropdown that varies by backend type.

#### Scenario: Google user sees name, email, and avatar
- **GIVEN** user is authenticated via Google
- **WHEN** user opens the profile menu
- **THEN** the identity section shows the user's name, email, and Google profile picture

#### Scenario: Google avatar fails and falls back to initials
- **GIVEN** user is authenticated via Google and the profile picture URL is broken
- **WHEN** the avatar image fails to load
- **THEN** the avatar falls back to a circle displaying the user's first initial

#### Scenario: Local user shows metadata identity
- **GIVEN** user is authenticated locally and the shop metadata contains `userName`
- **WHEN** user opens the profile menu
- **THEN** the identity section shows `metadata.userName`
- **AND** no email row is displayed

#### Scenario: Local user without metadata userName falls back to default
- **GIVEN** user is authenticated locally and the shop metadata does not contain `userName`
- **WHEN** user opens the profile menu
- **THEN** the identity section shows `"Local user"`

### Requirement: Profile menu shows shop context section
The system SHALL display a shop context section in the dropdown with backend-specific links and labels.

#### Scenario: Google user sees Drive folder link
- **GIVEN** user has an active Google Drive shop
- **WHEN** user opens the profile menu
- **THEN** a link to the shop's Google Drive folder is displayed
- **AND** the link opens the folder in a new tab when clicked

#### Scenario: Local user sees folder name
- **GIVEN** user has an active local shop
- **WHEN** user opens the profile menu
- **THEN** the local folder name is displayed

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
- **WHEN** user clicks the light mode toggle
- **THEN** the application theme changes to light mode
- **AND** the UI updates with light color scheme

### Requirement: Profile menu shows version information
The system SHALL display the app version and the shop metadata version in a compact row.

#### Scenario: User views version row
- **GIVEN** user opens the profile menu
- **WHEN** user views the system section
- **THEN** a row displays the app version and the shop metadata version separated by a middle dot

### Requirement: Profile menu contains disabled system buttons
The system SHALL display disabled buttons for "Edit metadata.json" and "Changelog" in the system section.

#### Scenario: User sees disabled buttons
- **GIVEN** user opens the profile menu
- **WHEN** user views the system section
- **THEN** "Edit metadata.json" and "Changelog" buttons are visible
- **AND** both buttons are disabled with reduced opacity and a not-allowed cursor

### Requirement: Profile menu reorganizes dropdown sections
The system SHALL organize the dropdown into ordered sections: Identity, Shop Context, Preferences, System, and Sign Out.

#### Scenario: User opens reorganized menu
- **GIVEN** user is authenticated
- **WHEN** user opens the profile menu
- **THEN** the dropdown contains sections in order: Identity, Shop Context, Preferences, System, Sign Out

### Requirement: Profile menu supports local avatar from metadata
The system SHALL read `metadata.iconsrc` as a relative image filename and display it as the local user's avatar.

#### Scenario: Local user with iconsrc sees custom avatar
- **GIVEN** user has a local shop with `metadata.iconsrc` set to a valid image filename
- **WHEN** user opens the profile menu
- **THEN** the trigger and identity section show the custom avatar

#### Scenario: Local user with broken iconsrc falls back to initials
- **GIVEN** user has a local shop with `metadata.iconsrc` set to a missing or invalid filename
- **WHEN** the avatar image fails to load
- **THEN** the avatar falls back to a circle displaying the user's first initial

### Requirement: Profile menu contains sign out option
The system SHALL provide a sign out option in the profile menu.

#### Scenario: User signs out from profile menu
- **GIVEN** profile menu is open
- **WHEN** user clicks the sign out option
- **THEN** the user is signed out
- **AND** the profile menu closes
