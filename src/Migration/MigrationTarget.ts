import type { MigrationContext } from './MigrationContext'

/**
 * A backend-specific migration surface (ADR-0012). `open` reads every stored
 * tab of the source shop ONCE into an in-memory workbook; all plan steps run
 * against `ctx` and touch nothing but memory.
 *
 * `writeBackup` is the run's one deliberate write, taken at the backup step:
 * a copy of the shop *as it currently is*, kept beside it — so it exists from
 * that step onwards even if the migration is never submitted.
 *
 * `persist` is the **Confirm and close** commitment: write every migrated tab
 * back to the shop, then flip the metadata version LAST — the atomic commit —
 * so a failure at any earlier point leaves the shop opening at its old
 * version, and the wizard simply reappears.
 */
export interface MigrationSession {
  ctx: MigrationContext
  writeBackup(): Promise<void>
  persist(): Promise<void>
}

export interface MigrationTarget {
  open(): Promise<MigrationSession>
}
