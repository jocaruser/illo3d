## Purpose

Define the brand identity system including shop logo display, favicon management, color palette design tokens, typography, and visual identity assets.

## Requirements

### Requirement: Shop logo renders in header
The system SHALL render the shop logo (from metadata `logo` field) in the app header, positioned to the LEFT of the "illo3d" text.

#### Scenario: Logo visible when metadata has logo path
- **WHEN** shop metadata contains a `logo` field with a relative path
- **THEN** the logo displays as an image to the left of "illo3d" text

#### Scenario: Logo not shown when metadata has no logo
- **WHEN** shop metadata has no `logo` field or it is empty
- **THEN** only "illo3d" text displays (no logo placeholder)

#### Scenario: Logo uses correct size
- **WHEN** the logo image loads
- **THEN** it renders with `h-8 w-auto` to match header height

#### Scenario: Logo displays with primary color filter
- **WHEN** the logo SVG renders
- **THEN** it uses a CSS filter to display in the primary brand color (blue)

### Requirement: Shop logo used for favicon
The system SHALL use the same shop logo file for the browser favicon.

#### Scenario: Favicon updates on shop load
- **WHEN** an active shop is loaded and has a `logo` path
- **THEN** the browser favicon (`<link rel="icon">`) updates to point to the logo file

#### Scenario: Favicon falls back to default
- **WHEN** no active shop is loaded or shop has no `logo` path
- **THEN** the browser uses the default `/logo.svg` favicon (the provided 3D printer logo)

### Requirement: Logo path is relative to shop folder
The system SHALL resolve the `logo` path relative to the shop's data folder.

#### Scenario: Logo path resolution for local-csv backend
- **WHEN** the backend is `local-csv` and metadata has `logo: "logo.svg"`
- **THEN** the path resolves relative to the selected local directory handle

#### Scenario: Logo path resolution for Google Sheets backend
- **WHEN** the backend is `google-sheets` and metadata has `logo: "assets/logo.png"`
- **THEN** the path resolves relative to the shop's Drive folder

### Requirement: Color palette is defined as design tokens
The system SHALL define a cohesive brand color palette via CSS custom properties in a shared token file using original Tailwind colors.

#### Scenario: Light mode tokens applied
- **WHEN** the user is in light mode
- **THEN** all `--color-*` custom properties use light mode values (gray-100, white, etc.)

#### Scenario: Dark mode tokens applied
- **WHEN** the user is in dark mode (`dark` class on `<html>`)
- **THEN** all `--color-*` custom properties use dark mode values (gray-950, gray-900, etc.)

#### Scenario: Tokens available in Tailwind classes
- **WHEN** a component uses `className="bg-surface text-primary"`
- **THEN** the correct light or dark color is applied based on current mode

### Requirement: Custom typography is loaded and applied
The system SHALL load Barlow Condensed for display/heading text and Manrope for body text via self-hosted font files.

#### Scenario: Headings use display font
- **WHEN** any heading element (`h1`–`h4`) renders
- **THEN** it uses the Barlow Condensed font family

#### Scenario: Body text uses body font
- **WHEN** any paragraph, label, or body text element renders
- **THEN** it uses the Manrope font family

#### Scenario: Fonts load without layout shift
- **WHEN** the page first loads
- **THEN** text does not visibly shift when web fonts finish loading (using `font-display: swap`)

### Requirement: Shop logo displays correctly in header
The system SHALL provide a header logo display that handles the shop logo image correctly.

#### Scenario: Logo displays next to text
- **WHEN** the logo is present in metadata
- **THEN** it displays in a flex row with `gap-2` to the left of "illo3d" text

#### Scenario: Logo has appropriate aria attributes
- **WHEN** the logo image renders
- **THEN** it has `alt=""` (decorative, as text "illo3d" is present) and `aria-hidden="true"`

### Requirement: Reusable component library provides consistent UI
The system SHALL provide reusable components for consistent table, card, form, and alert styling.

#### Scenario: DataTable component usage
- **WHEN** a table component uses `DataTable`, `TableHead`, `TableBody`, `TableRow`
- **THEN** it renders with consistent zebra striping using `bg-surface` and `bg-surface-alt`

#### Scenario: Card component usage
- **WHEN** a component uses `Card`, `CardHeader`, `CardBody`, `CardFooter`
- **THEN** it renders with consistent borders, backgrounds, and shadows using design tokens

#### Scenario: Form component usage
- **WHEN** a form uses `FormInput`, `FormTextarea`, `FormSelect`, `FormLabel`, `FormGroup`
- **THEN** inputs render with consistent styling using design tokens

#### Scenario: Alert component usage
- **WHEN** an alert uses `AlertBox` or `AlertStrip`
- **THEN** it renders with semantic colors (info, success, warning, danger, primary, secondary)

### Requirement: Detail pages use widget-based layouts
The system SHALL use DetailWidget and DetailPageLayout components for consistent detail page layouts.

#### Scenario: Detail page uses widgets
- **WHEN** a detail page renders header information
- **THEN** it uses `DetailWidget` components in a `DetailWidgetGrid` for consistent layout

#### Scenario: Widgets support colspan
- **WHEN** a widget needs to span multiple columns
- **THEN** the `colSpan` prop (1-4) controls the grid span

### Requirement: Design tokens use RGB format for opacity support
The system SHALL define color tokens in RGB format to enable Tailwind opacity modifiers.

#### Scenario: Token with opacity modifier
- **WHEN** a component uses `className="bg-surface/50"`
- **THEN** the background renders at 50% opacity of the surface color
