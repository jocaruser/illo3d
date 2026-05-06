## Requirements

### Requirement: Toast system displays action-result feedback

The system SHALL provide a unified toast notification surface for all ephemeral action-result feedback (success, error, and progress). The toast surface SHALL be non-blocking, stackable, and dismissible. All toast messages SHALL be translatable via i18n.

#### Scenario: Success toast appears after action

- **WHEN** an action completes successfully (e.g., save workbook, archive client)
- **THEN** a success toast appears with a brief message
- **AND** it auto-dismisses after 3 seconds

#### Scenario: Error toast appears after action failure

- **WHEN** an action fails (e.g., network error, quota exceeded)
- **THEN** an error toast appears with the failure message
- **AND** the toast persists until dismissed by the user (or per library defaults)

#### Scenario: Save failure toast MAY include in-toast retry

- **WHEN** workbook Save from the header fails after the blocking overlay dismisses
- **THEN** the error toast MAY expose a Retry action that triggers Save again
- **AND** all labels for that action SHALL come from i18n

#### Scenario: OperationToast error does not include in-toast retry

- **WHEN** hydration or Refresh fails and `OperationToast` surfaces the error via `toast.error`
- **THEN** the error toast SHALL show the failure message only (no in-toast Retry action)
- **AND** the user MAY retry using other header or page controls (e.g. Refresh) where applicable

#### Scenario: Toast messages are localized

- **WHEN** the UI language is Spanish
- **THEN** toast messages display Spanish text from translation resources

### Requirement: Progress toast tracks workbook load

The system SHALL display a non-dismissible progress toast during workbook hydration and refresh. The toast SHALL show the current sheet being loaded, the count of completed sheets, and a visual progress bar. The toast SHALL dismiss automatically when loading completes or transitions to an error toast on failure. The toast SHALL be non-blocking, allowing user interaction during read-only operations. Progress strings SHALL use i18n keys (e.g. `workbook.loadingWorkbook`, `workbook.loadingSheet`).

#### Scenario: Progress toast shows during hydration

- **WHEN** the workbook begins hydration after shop open
- **THEN** a progress toast appears showing localized loading copy
- **AND** as each sheet completes, the count updates (e.g., progress fraction and sheet name)
- **AND** a progress bar fills proportionally
- **AND** the toast is non-blocking (user can interact with the app)

#### Scenario: Progress toast transitions to error on failure

- **WHEN** a sheet read fails during hydration
- **THEN** the progress toast is replaced by a persistent error toast with the failure message
- **AND** the error toast SHALL NOT include an in-toast Retry action from `OperationToast`
- **AND** the workbook store reflects the failure state per `workbook-snapshot` (e.g. `status: 'error'` on initial hydrate)

### Requirement: Progress toast does NOT track workbook save

The system SHALL NOT use progress toasts for workbook save operations. Save operations SHALL use a blocking overlay instead (see blocking-save-overlay capability).

#### Scenario: Save operation does not show toast

- **WHEN** the user triggers Save
- **THEN** no progress toast appears
- **AND** the blocking overlay from blocking-save-overlay is shown instead

### Requirement: Toast system supports dark mode

The toast surface SHALL automatically adapt to the current theme (light or dark) by reading the `.dark` class on the `<html>` element. Toast colors in dark mode SHALL match the app's existing dark palette.

#### Scenario: Toast renders in dark mode

- **WHEN** the theme is set to dark
- **THEN** toasts render with dark background, light text, and appropriate border colors
- **AND** no additional configuration is required

### Requirement: Thin toast wrapper decouples app from library

The system SHALL provide a thin wrapper module (`src/lib/toast.ts`) that exposes a minimal API for showing toasts. Application code SHALL call the wrapper, not the underlying library directly.

#### Scenario: App code uses wrapper API

- **WHEN** a component needs to show a toast
- **THEN** it imports from `src/lib/toast.ts`
- **AND** does not import from `sonner` directly
