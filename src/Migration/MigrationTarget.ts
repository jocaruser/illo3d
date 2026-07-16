import type { MigrationContext } from './MigrationContext'

/**
 * A backend-specific migration surface. `createWorkingCopy` clones the shop
 * into an isolated working copy (sibling subfolder for Local CSV, spreadsheet
 * copy for Drive); all steps run against `ctx`. `commit` publishes the
 * migrated data back — the metadata version flip is the last, atomic write, so
 * a failure at any earlier point leaves the original shop untouched.
 */
export interface WorkingCopy {
  ctx: MigrationContext
  commit(options: { keepOriginalAsBackup: boolean }): Promise<void>
}

export interface MigrationTarget {
  createWorkingCopy(): Promise<WorkingCopy>
}
