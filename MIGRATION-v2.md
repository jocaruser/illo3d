# Migration Guide: v2.0.0 Data Model

## Overview

Version 2.0.0 introduces a major data model upgrade that shifts from job-based status tracking to piece-based workflow management, adds audit trail capabilities, and introduces metadata-driven kanban columns.

## Breaking Changes

### Jobs Sheet
**Before (v1.x):**
```
id,client_id,description,status,price,board_order,created_at,archived,deleted
```

**After (v2.0.0):**
```
id,client_id,description,price,due_date,completed,created_at,archived,deleted
```

**Changes:**
- Removed: `status`, `board_order`
- Added: `due_date`, `completed`
- Migration: Job status is now determined by the `completed` date field

### Pieces Sheet
**Before (v1.x):**
```
id,job_id,name,status,price,units,created_at,archived,deleted
```

**After (v2.0.0):**
```
id,job_id,name,status,price,units,board_order,created_at,archived,deleted
```

**Changes:**
- Added: `board_order` (for kanban column ordering)
- Status values are now free-form strings defined by metadata `kanbanColumns`

### Inventory Sheet
**Before (v1.x):**
```
id,type,name,qty_current,warn_yellow,warn_orange,warn_red,created_at,archived,deleted
```

**After (v2.0.0):**
```
id,type,name,colour,photo,qty_current,warn_yellow,warn_orange,warn_red,created_at,archived,deleted
```

**Changes:**
- Added: `colour`, `photo` (optional visual fields)

### New: History Sheet
```
id,entity_type,entity_id,raw_data_before,raw_data_after,changed_at,changed_by
```

**Purpose:** Audit trail for all data changes

## Metadata Changes

Update your `illo3d.metadata.json` to v2.0.0:

```json
{
  "app": "illo3d",
  "version": "2.0.0",
  "spreadsheetId": "your-spreadsheet-id",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "createdBy": "your-email@example.com",
  "kanbanColumns": [
    { "name": "To Do", "color": "#3B82F6" },
    { "name": "In Progress", "color": "#F59E0B" },
    { "name": "Review", "color": "#8B5CF6" },
    { "name": "Done", "color": "#10B981" }
  ],
  "completedStatusLabel": "Done",
  "defaultDueDate": 7,
  "homepageViews": [
    { "type": "kanban", "column": "In Progress", "days": 30 },
    { "type": "calendar", "column": "Done", "days": 14 }
  ]
}
```

## Migration Steps

### For Existing Shops

1. **Backup your data** before making any changes

2. **Update Jobs CSV:**
   - Remove `status` and `board_order` columns
   - Add `due_date` and `completed` columns
   - Convert old status to completed dates:
     - `paid`, `delivered` → set `completed` to job creation date
     - `draft`, `in_progress` → leave `completed` empty

3. **Update Pieces CSV:**
   - Add `board_order` column (can be empty initially)
   - Status values should match your new `kanbanColumns` names

4. **Update Inventory CSV:**
   - Add `colour` and `photo` columns (can be empty)

5. **Create History CSV:**
   ```
   id,entity_type,entity_id,raw_data_before,raw_data_after,changed_at,changed_by
   ```

6. **Update Metadata:**
   - Change version to `2.0.0`
   - Add `kanbanColumns` array
   - Optionally add `completedStatusLabel`, `defaultDueDate`, `homepageViews`

### Automated Migration

For Google Drive shops, the app will validate structure and may prompt for column additions. For local CSV shops, manually update your files following the steps above.

## New Features

### 1. Piece-Based Kanban
- Drag and drop pieces between columns
- Job grouping for contiguous pieces
- Due date urgency indicators

### 2. Calendar View
- Month grid on desktop
- Day list on mobile
- Pieces shown on job due dates

### 3. History/Audit Trail
- All changes logged automatically
- Before/after comparison
- Search and filter capabilities

### 4. Inventory Colours
- Colour swatches in inventory table
- Colour picker on inventory detail
- Visual identification in dropdowns

### 5. Job Completion Flow
- "Complete" button on job detail
- Optional income transaction creation
- Completed jobs excluded from kanban

## Validation

The app now validates structure more strictly but tolerates extra columns:
- Checks expected columns exist at expected positions
- Ignores extra columns beyond expected length
- Allows user-defined custom columns

## Troubleshooting

**Issue:** "Missing required columns" error
**Solution:** Ensure all required columns are present in exact order per the schemas above

**Issue:** Pieces not showing in kanban
**Solution:** Check that piece status values match the `kanbanColumns` names in metadata

**Issue:** Jobs showing in kanban
**Solution:** Completed jobs (with `completed` date) are intentionally excluded

## Rollback

To rollback to v1.x:
1. Restore your backup files
2. Revert metadata version to `1.x.x`
3. Remove history sheet if desired
