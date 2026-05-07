## Purpose

Define minimal CSS-only animations for dialog entrances, button hover effects, card lift effects, and accessibility-compliant reduced motion support.

## Requirements

### Requirement: Dialog entrance animation
The system SHALL animate dialog/modal appearance with CSS keyframe animations.

#### Scenario: Dialog opens
- **WHEN** a dialog or popup opens
- **THEN** the overlay fades in over 150ms
- **AND** the panel scales up from 95% to 100% with a slight upward translate

#### Implementation Details
- CSS keyframes: `dialog-overlay-fade` and `dialog-panel-enter`
- Timing: 150ms ease-out for overlay, 200ms cubic-bezier(0.16, 1, 0.3, 1) for panel
- Classes: `.dialog-overlay-enter` and `.dialog-panel-enter`

### Requirement: Button hover micro-interactions
The system SHALL provide subtle hover feedback on buttons using CSS transitions.

#### Scenario: Primary button hover
- **WHEN** the user hovers over a `.btn-primary` button
- **THEN** the button scales up to 102% over 150ms
- **AND** on active/press, scales down to 98%

#### Scenario: Secondary button hover
- **WHEN** the user hovers over a `.btn-secondary` button
- **THEN** the button scales up to 102% over 150ms

#### Implementation Details
- CSS utility classes using `transition-all duration-150`
- Hover transform: `scale(1.02)`
- Active transform: `scale(0.98)`
- Motion reduce: transitions disabled when `prefers-reduced-motion: reduce`

### Requirement: Card hover lift effect
The system SHALL provide subtle lift feedback on interactive cards.

#### Scenario: StatCard hover (when clickable)
- **WHEN** the user hovers over a clickable StatCard
- **THEN** the card translates up by 2px and shadow increases
- **AND** the transition completes over 200ms

#### Scenario: Card component interactive mode
- **WHEN** a Card component has `interactive={true}` prop
- **THEN** it applies the same lift effect on hover

#### Implementation Details
- CSS transition on transform and box-shadow
- Hover: `translateY(-2px)` with increased shadow
- Motion reduce: no transform or shadow change

### Requirement: Reduced motion support
The system SHALL respect user preferences for reduced motion.

#### Scenario: User prefers reduced motion
- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** all CSS animations and transitions are disabled
- **AND** elements render in their final state immediately

#### Implementation Details
- Media query `@media (prefers-reduced-motion: reduce)` disables all animations
- Tailwind `motion-reduce:` utilities applied to animated elements
- All animations have `motion-reduce:transition-none` and `motion-reduce:hover:scale-100`

## CSS Animation Classes

| Class | Effect | Duration | Timing |
|-------|--------|----------|--------|
| `.dialog-overlay-enter` | Fade in (opacity 0→1) | 150ms | ease-out |
| `.dialog-panel-enter` | Scale 0.95→1, translateY 10px→0 | 200ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `.fade-in` | Simple fade in | 200ms | ease-out |
| `.slide-up` | Fade + slide up 10px | 200ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `.btn-hover-scale` | Scale 1→1.02 on hover | 150ms | ease-out |
| `.card-hover-lift` | TranslateY -2px + shadow on hover | 200ms | ease-out |

All classes respect `prefers-reduced-motion: reduce`.

## Not Implemented

The following animation features were considered but not implemented:

- **Page transitions on route change**: Requires JavaScript animation library
- **Dashboard stat card stagger on mount**: Requires JavaScript for coordination
- **Loading spinner animation**: Current Tailwind `animate-spin` is sufficient
