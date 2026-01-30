# Requirements

## Version 1 - MVP
Critical features for basic operation

### Feature: Home/Sales Page
- [ ] Side navigation to all pages
- [ ] Display sales table/list with filters and search
- [ ] Click sale to expand and view pieces
- [ ] "New Sale" button to create sales
- [ ] Record sales with date, description, price
- [ ] Add pieces to sale (with quantities)
- [ ] Auto-calculate total cost and profit

### Feature: Inventory Management Page
- [ ] Tabs for Filaments, Consumables, Printers
- [ ] Add/edit/delete printers (name, max filaments, power cost)
- [ ] Add/edit/delete filaments (name, type, colour, purchase date, grams, total cost, price per gram)
- [ ] Add/edit/delete consumables (name, purchase date, quantity, total cost, price per unit)
- [ ] Mark items as depleted
- [ ] Export (image/PDF) to share how many different filament colours are available

### Feature: Budget Calculator Page
- [ ] Standalone page with calculator
- [ ] Also accessible as modal from any page
- [ ] Select printer for the piece
- [ ] Add filaments (up to printer's max) with grams
- [ ] Add consumables (unlimited) with quantities
- [ ] Calculate total cost with markup
- [ ] Show suggested price


## Version 2 - Improved Input
Ease data entry and bulk operations

### Feature: Bulk Data Tools
- [ ] Cross-reference bank extracts with data
- [ ] Batch process .3mf files for past orders
- [ ] Google Drive integration for data storage
- [ ] Data import (format TBD)

### Feature: [DRAFT] Pieces Library
- [ ] Dedicated page to view/manage saved pieces
- [ ] Reuse pieces in sales
- [ ] When creating piece, show similar pieces by name and weight
- [ ] Display piece details in floating window
- [ ] Budget calculator can save pieces to library


## Version 3 - Kanban
Task and order management

### Feature: Kanban Board
- [ ] Columns: pa pensare, PRECIO, POR HACER, HECHO, OBJETIVOS, DESCARATADO POR PRECIO
- [ ] Create/edit/move cards
- [ ] Track order status
- [ ] Kanban displays sales in draft mode
- [ ] Sales appear in kanban until marked as completed (removed from draft)
- [ ] Completed sales move to sales history


## Version 4 - Integrations
Automated material tracking

### Feature: Material Import
- [ ] Upload .3mf files to Google Drive
- [ ] Parse .3mf for material usage
- [ ] MakerWorld integration


## Version 5 - Analytics
Advanced insights and reporting

### Feature: Graphs & Analytics
- [ ] Most profitable items
- [ ] Material usage trends
- [ ] Sales patterns
- [ ] Profit margins over time


## Unplanned - Crazy Ideas
Decided and certain, but not scheduled. Uncertain ideas stay in docs/context.txt Open Conversations.

### Feature: Shareable Filament Colours
- [ ] Optional: public Drive file with filament colour codes for shareable link
