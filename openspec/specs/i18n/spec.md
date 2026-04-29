## Purpose

Define internationalization requirements for the application, including initialization with user preferences and runtime language switching.

## Requirements

### Requirement: i18n initialization with user preference
The system SHALL initialize i18n with the user's saved language preference on application startup.

#### Scenario: Application initializes with saved language
- **GIVEN** user has Spanish saved as their language preference
- **WHEN** the application initializes
- **THEN** i18n loads with Spanish as the active language
- **AND** all translated content displays in Spanish

#### Scenario: Application initializes with default language
- **GIVEN** no language preference exists
- **WHEN** the application initializes
- **THEN** i18n loads with English as the active language

### Requirement: Runtime language switching
The system SHALL allow changing the active language without requiring a page reload.

#### Scenario: Language changes immediately
- **GIVEN** user is viewing the dashboard in English
- **WHEN** user switches language to Spanish
- **THEN** all UI text updates to Spanish immediately
- **AND** no page reload occurs

### Requirement: Translation keys for new UI elements
The system SHALL provide translation keys for the profile menu, language selector, and theme toggle.

#### Scenario: All new UI elements are translatable
- **GIVEN** the application is running
- **WHEN** viewing profile menu elements
- **THEN** all labels and buttons have corresponding translation keys in en.json and es.json
