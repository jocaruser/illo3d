## Purpose

Provide reusable UI components for consistent table, card, form, alert, widget, and layout patterns across the application.

## Requirements

### Requirement: DataTable component provides consistent table styling
The system SHALL provide a `DataTable` component with `TableHead`, `TableBody`, `TableRow`, `TableHeader`, and `TableCell` subcomponents for consistent table rendering.

#### Scenario: DataTable with zebra striping
- **WHEN** a table uses `DataTable` components
- **THEN** rows automatically alternate between `bg-surface-elevated` (odd) and `bg-surface-alt` (even)

#### Scenario: DataTable headers
- **WHEN** a table uses `TableHead` with `TableHeader` cells
- **THEN** headers render with consistent styling: `bg-surface`, uppercase text, muted color

#### Scenario: DataTable cells
- **WHEN** a table uses `TableCell`
- **THEN** cells render with consistent padding and text color using design tokens

### Requirement: Card component provides consistent card containers
The system SHALL provide a `Card` component with `CardHeader`, `CardBody`, `CardFooter`, `CardTitle`, and `CardDescription` subcomponents.

#### Scenario: Card with all sections
- **WHEN** a card uses `CardHeader`, `CardBody`, and `CardFooter`
- **THEN** each section renders with consistent borders, backgrounds, and spacing

#### Scenario: Card without footer
- **WHEN** a card has no `CardFooter`
- **THEN** the card renders header and body only, with no empty footer space

#### Scenario: Card shadows
- **WHEN** a card uses the `shadow` prop
- **THEN** it renders with `shadow-sm` (default), `shadow` (medium), or `shadow-lg` (large) elevation

#### Scenario: EmptyCard for empty states
- **WHEN** a card uses `EmptyCard`
- **THEN** it renders a centered message with appropriate padding for empty data states

#### Scenario: Card interactive hover effect
- **WHEN** a card has `interactive={true}` prop
- **THEN** it lifts 2px on hover with increased shadow
- **AND** transitions smoothly over 200ms
- **AND** respects `prefers-reduced-motion` when set

### Requirement: Form components provide consistent input styling
The system SHALL provide `FormInput`, `FormTextarea`, `FormSelect`, `FormLabel`, `FormGroup`, and `FormError` components.

#### Scenario: FormInput usage
- **WHEN** a form uses `FormInput`
- **THEN** it renders with consistent borders, backgrounds, focus states, and dark mode support

#### Scenario: FormTextarea usage
- **WHEN** a form uses `FormTextarea`
- **THEN** it renders with consistent styling matching `FormInput`

#### Scenario: FormLabel and FormGroup
- **WHEN** a form field uses `FormLabel` inside `FormGroup`
- **THEN** the label renders with consistent typography and spacing

#### Scenario: FormError display
- **WHEN** a form field has an error
- **THEN** `FormError` renders the error message in danger color with appropriate spacing

### Requirement: AlertBox component provides semantic alert styling
The system SHALL provide `AlertBox` and `AlertStrip` components with semantic variant support.

#### Scenario: AlertBox variants
- **WHEN** an alert uses `AlertBox` with variant `info`, `success`, `warning`, `danger`, `primary`, or `secondary`
- **THEN** it renders with appropriate semantic colors for background, border, and text

#### Scenario: AlertBox with title
- **WHEN** an alert uses `AlertBox` with a `title` prop
- **THEN** the title renders with bold font weight above the children content

#### Scenario: AlertStrip usage
- **WHEN** a compact alert uses `AlertStrip`
- **THEN** it renders with reduced padding and rounded corners for inline alerts

### Requirement: DetailWidget component provides widget layouts
The system SHALL provide `DetailWidget` and `DetailWidgetGrid` components for detail page layouts.

#### Scenario: DetailWidget with label and value
- **WHEN** a widget uses `DetailWidget` with `label` and `value` props
- **THEN** it renders with the label as muted uppercase text and value as large semibold text

#### Scenario: DetailWidget colspan
- **WHEN** a widget uses `colSpan` prop (1, 2, 3, or 4)
- **THEN** it spans that many columns in the grid (responsive, md breakpoint)

#### Scenario: DetailWidgetGrid columns
- **WHEN** a grid uses `DetailWidgetGrid` with `columns` prop (2, 3, or 4)
- **THEN** the grid renders with that many columns at the md breakpoint

### Requirement: DetailPageLayout component provides detail page structure
The system SHALL provide `DetailPageLayout`, `DetailPageHeader`, `DetailPageSection`, `DetailPageActions`, and `DetailPageWidgetGrid` components.

#### Scenario: DetailPageLayout with back navigation
- **WHEN** a detail page uses `DetailPageLayout` with `backTo` and `backLabel` props
- **THEN** a back link arrow renders at the top of the page

#### Scenario: DetailPageHeader with widgets
- **WHEN** a header uses `DetailPageHeader` with `widgets` prop
- **THEN** the widgets render below the title in the header area

#### Scenario: DetailPageHeader with actions
- **WHEN** a header uses `DetailPageHeader` with `actions` prop
- **THEN** the actions render to the right of the title

#### Scenario: DetailPageSection with title
- **WHEN** a section uses `DetailPageSection` with `title` prop
- **THEN** it renders with a section heading and consistent bottom margin

### Requirement: Component library uses design tokens exclusively
All components in the library SHALL use design token classes (`bg-surface`, `text-text`, `border-border`, etc.) rather than hardcoded color values.

#### Scenario: Token-based styling
- **WHEN** any library component renders
- **THEN** all colors, borders, and backgrounds use design token classes

#### Scenario: Dark mode support
- **WHEN** a library component renders in dark mode
- **THEN** it automatically uses dark token values without additional props

### Requirement: CSS animation utilities provide micro-interactions
The system SHALL provide CSS utility classes for consistent micro-interactions with reduced-motion support.

#### Scenario: Button hover scale
- **WHEN** an element uses `btn-hover-scale` class
- **THEN** it scales to 102% on hover over 150ms
- **AND** scales to 98% on active/press
- **AND** respects `prefers-reduced-motion: reduce`

#### Scenario: Card hover lift
- **WHEN** an element uses `card-hover-lift` class
- **THEN** it translates up 2px with increased shadow on hover
- **AND** respects `prefers-reduced-motion: reduce`

#### Scenario: Dialog entrance animation
- **WHEN** a dialog overlay uses `dialog-overlay-enter` class
- **THEN** it fades in over 150ms
- **AND** the panel with `dialog-panel-enter` scales from 95% to 100%

#### Scenario: Reduced motion disables animations
- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** all CSS animations and transitions are disabled
- **AND** elements render in their final state immediately
