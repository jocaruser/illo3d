import type { MigrationContext } from './MigrationContext'

export interface CommitOptions {
  keepOriginalAsBackup: boolean
}

export interface WorkingCopy {
  ctx: MigrationContext
  /** Atomically swaps the migrated working copy into the source's place. */
  commit(options: CommitOptions): Promise<void>
}

export interface MigrationTarget {
  createWorkingCopy(): Promise<WorkingCopy>
}
