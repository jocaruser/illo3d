## Purpose

Define user-configurable settings for language and theme that persist across sessions.

## Requirements

### Requirement: User language preference persists across sessions
The system SHALL store the user's selected language in localStorage and restore it on application startup.

#### Scenario: Language preference is saved
- **WHEN** user selects a language from the profile menu
- **THEN** the system stores the language preference in localStorage

#### Scenario: Language preference is restored on reload
- **GIVEN** user has previously selected Spanish as their language
- **WHEN** user reloads the application
- **THEN** the UI displays in Spanish without requiring reselection

### Requirement: User theme preference persists across sessions
The system SHALL store the user's selected theme (light/dark) in localStorage and restore it on application startup. Theme restoration SHALL occur from the application JavaScript bundle, not from an inline `<script>` in `index.html`.

#### Scenario: Theme preference is saved
- **WHEN** user toggles dark mode in the profile menu
- **THEN** the system stores the theme preference in localStorage

#### Scenario: Theme preference is restored on reload
- **GIVEN** user has previously enabled dark mode
- **WHEN** user reloads the application
- **THEN** the UI displays in dark mode without requiring re-toggle
- **AND** no inline script is executed in `index.html` for theme detection

#### Scenario: Theme initialization happens before React render
- **WHEN** the application bundle loads
- **THEN** the theme initialization code runs before `createRoot().render()`
- **AND** the `dark` class is applied to `document.documentElement` if needed
- **AND** React then mounts into the already-themed document

### Requirement: Theme initialization runs from bundle without inline scripts
The system SHALL move the theme detection and application logic from any inline `<script>` in `index.html` into the application's JavaScript bundle (e.g., `main.tsx` or a dedicated module imported early). This SHALL eliminate the need for `script-src 'unsafe-inline'` in the Content Security Policy.

#### Scenario: No inline scripts in index.html
- **WHEN** `index.html` is inspected
- **THEN** it contains no `<script>` tags with inline code
- **AND** all JavaScript is loaded via `type="module"` from external files

#### Scenario: CSP does not require unsafe-inline for scripts
- **WHEN** the Content Security Policy is evaluated
- **THEN** `script-src` does not include `'unsafe-inline'`
- **AND** all application scripts still load and execute correctly

### Requirement: Default preferences for new users
The system SHALL default to English language and light theme when no preferences exist.

#### Scenario: First-time user loads application
- **GIVEN** no previous preferences exist in localStorage
- **WHEN** user loads the application
- **THEN** the UI displays in English with light theme
