import {
  BACKUP_SKIPPED_KEY,
  BACKUP_STEP_ID,
  migrationStepIds,
} from '@/Hook/useMigration'
import type {
  MigrationPhase,
  MigrationStepState,
  MigrationStepStatus,
} from '@/Store/migrationStore'

/** Row label per step id. Ids are sheet names plus the synthetic backup step. */
const STEP_LABEL_KEY: Record<string, string> = {
  [BACKUP_STEP_ID]: 'wizard.migrationEntityBackup',
  clients: 'wizard.migrationEntityClients',
  crm_notes: 'wizard.migrationEntityCrmNotes',
  tags: 'wizard.migrationEntityTags',
  tag_links: 'wizard.migrationEntityTagLinks',
  jobs: 'wizard.migrationEntityJobs',
  pieces: 'wizard.migrationEntityPieces',
  piece_items: 'wizard.migrationEntityPieceItems',
  inventory: 'wizard.migrationEntityInventory',
  lots: 'wizard.migrationEntityLots',
  transactions: 'wizard.migrationEntityTransactions',
  audit_log: 'wizard.migrationEntityAuditLog',
}

const STATUS_LABEL_KEY: Record<MigrationStepStatus, string> = {
  pending: 'wizard.migrationStatusPending',
  running: 'wizard.migrationStatusRunning',
  done: 'wizard.migrationStatusDone',
  failed: 'wizard.migrationStatusFailed',
}

/** i18n key for a step's row label; null for an id no plan of ours declares. */
export function stepLabelKey(id: string): string | null {
  return STEP_LABEL_KEY[id] ?? null
}

export function stepStatusKey(status: MigrationStepStatus): string {
  return STATUS_LABEL_KEY[status]
}

/**
 * The rows the wizard grid renders.
 *
 * Idle runs show a static grid seeded from the resolved plan chain; once the
 * orchestrator takes over, the store is the source of truth. Declining a backup
 * pins the backup row to done/Skipped in both phases — the orchestrator still
 * makes a working copy (that is how a failed run stays recoverable), but from
 * the user's point of view no backup is being kept.
 */
export function migrationStepStates(
  phase: MigrationPhase,
  liveSteps: MigrationStepState[],
  shopVersion: string,
  keepOriginalAsBackup: boolean | null
): MigrationStepState[] {
  const rows: MigrationStepState[] =
    phase === 'idle'
      ? migrationStepIds(shopVersion).map((id) => ({ id, status: 'pending' }))
      : liveSteps

  if (keepOriginalAsBackup !== false) return rows

  return rows.map((row) =>
    row.id === BACKUP_STEP_ID
      ? {
          ...row,
          status: 'done',
          description: BACKUP_SKIPPED_KEY,
          error: undefined,
        }
      : row
  )
}

/** Count of finished rows, for the wizard's "{done} of {total} done" summary. */
export function doneCount(rows: MigrationStepState[]): number {
  return rows.filter((row) => row.status === 'done').length
}
