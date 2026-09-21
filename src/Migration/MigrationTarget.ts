import type { MigrationContext } from './MigrationContext'

/**
 * In-memory upgrade state for one migration run. Steps mutate `ctx`; `submit`
 * is the only persistence boundary back to the shop at rest.
 */
export interface MigrationSession {
  ctx: MigrationContext
  submit(options: { keepOriginalAsBackup: boolean }): Promise<void>
}

/**
 * Backend-specific migration port: optional pre-upgrade backup, then an
 * in-memory session the orchestrator runs plans against until the owner
 * confirms submit in the wizard.
 */
export interface MigrationTarget {
  writePreUpgradeBackup(): Promise<void>
  openSession(): Promise<MigrationSession>
}
