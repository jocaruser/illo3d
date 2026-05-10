# Kanban Feature Analysis: Old vs Current Implementation

## Summary
The kanban was changed from **job-based cards** (old) to **piece-based cards** (current), losing many features.

## OLD Implementation (KanbanColumn.tsx) - Job-Based Cards

### Card Content & Data Display
- [x] **Job description** as primary card title
- [x] **Client name** shown on card
- [x] **Job pricing total** (JobPricingTotalDisplay component)
- [x] **Material cost calculation** with benefit/profit display
- [x] **Due date gradient indicator** (colored left border based on urgency)
- [x] **Job status** as the organizing principle

### Drag & Drop Features
- [x] **Drop gaps between cards** - visual drop zones to reorder within column
- [x] **Insert before ID** - precise positioning when dropping
- [x] **Column-level drag highlighting** - entire column background changes on drag over
- [x] **Drag prevention during updates** - can't drag while status is updating
- [x] **Cursor states** - grab/grabbing cursor feedback
- [x] **Click suppression after drag** - prevents accidental navigation after drag

### Interactions
- [x] **Click card to navigate** to job detail page
- [x] **Status dropdown on each card** - accessible way to change status without dragging
- [x] **Keyboard navigation** - Enter/Space to open job, focus rings visible
- [x] **Hover effects** - border and shadow changes on hover

### Column Features
- [x] **Cancelled column cap** - only shows 10 cancelled jobs with "View all" link
- [x] **Job count** displayed in column header
- [x] **Empty column placeholder** - visible drop zone when column is empty

### Accessibility
- [x] **Screen reader support** - status dropdown is visually hidden but accessible
- [x] **ARIA labels** - proper labeling for move actions
- [x] **Focus management** - visible focus rings, keyboard operable

---

## CURRENT Implementation (KanbanBoard.tsx) - Piece-Based Cards

### Card Content & Data Display
- [x] **Piece name** as primary card title
- [x] **Job name reference** shown as secondary text
- [x] **Units count** display
- [x] **Due date urgency stripe** (red/yellow left border)
- [ ] ~~Job pricing total~~ MISSING
- [ ] ~~Material cost/benefit~~ MISSING
- [ ] ~~Client name~~ MISSING

### Drag & Drop Features
- [x] **Basic drag and drop** between columns
- [ ] ~~Drop gaps between cards~~ MISSING
- [ ] ~~Insert before ID / reordering~~ MISSING
- [x] **Basic column drag highlighting** (blue border)
- [ ] ~~Drag prevention during updates~~ MISSING
- [ ] ~~Cursor states (grab/grabbing)~~ MISSING
- [ ] ~~Click suppression after drag~~ MISSING

### Interactions
- [ ] ~~Click card to navigate~~ MISSING
- [ ] ~~Status dropdown on cards~~ MISSING
- [ ] ~~Keyboard navigation~~ MISSING
- [x] **Basic hover effects** (shadow only)

### Column Features
- [x] **Piece count** displayed in column header
- [x] **Column color indicators** (from metadata)
- [ ] ~~Cancelled column cap~~ MISSING (not applicable for pieces)
- [x] **View all link** when >10 items
- [x] **Empty column message**

### Accessibility
- [ ] ~~Screen reader support for status change~~ MISSING
- [ ] ~~ARIA labels~~ MISSING
- [ ] ~~Focus management~~ MISSING

---

## Key Architectural Differences

| Aspect | OLD | CURRENT |
|--------|-----|---------|
| **Organizing Entity** | Jobs | Pieces |
| **Card Content** | Rich job info (pricing, client, profit) | Simple piece info |
| **Reorder Within Column** | Yes, via drop gaps | No |
| **Status Change Method** | Drag OR dropdown | Drag only |
| **Navigation** | Click card → job detail | None |
| **Business Logic** | Shows job profitability | Shows piece status only |

## Why The Change Broke The UX

1. **Lost Business Context**: Job cards showed pricing and profit at a glance - critical for business decisions
2. **Lost Navigation**: Can't click to view job details anymore
3. **Lost Accessibility**: No keyboard support, no screen reader support
4. **Lost Reordering**: Can't reorder items within a column
5. **Piece-Centric Issues**: Pieces don't have business value without their parent job context

## Recommendation

Revert to **job-based kanban cards** or create a **hybrid view** that:
- Shows job cards with piece count indicator
- Expands to show pieces when clicked
- Maintains all the rich job information (pricing, client, profit)
- Keeps the drag-and-drop and accessibility features
