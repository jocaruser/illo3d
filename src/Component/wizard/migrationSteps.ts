import {
  BACKUP_SKIPPED_KEY,
  BACKUP_STEP_ID,
  migrationHopMajors,
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

export interface DescriptionBullet {
  labelKey: string
  itemKey: string
}

/** What each hop unlocks, keyed by the hop's `fromMajor`. */
const HOP_DESCRIPTION_KEYS: Record<number, DescriptionBullet[]> = {
  1: [
    {
      labelKey: 'wizard.migrationDescriptionLabel1',
      itemKey: 'wizard.migrationDescriptionItem1',
    },
    {
      labelKey: 'wizard.migrationDescriptionLabel2',
      itemKey: 'wizard.migrationDescriptionItem2',
    },
  ],
  2: [
    {
      labelKey: 'wizard.migrationDescriptionLabelDueDates',
      itemKey: 'wizard.migrationDescriptionItemDueDates',
    },
    {
      labelKey: 'wizard.migrationDescriptionLabelColours',
      itemKey: 'wizard.migrationDescriptionItemColours',
    },
  ],
}

/**
 * The wizard's explanation bullets, derived from the resolved plan chain: each
 * hop contributes its own label+item pairs, in run order. A hop we ship no
 * copy for contributes nothing (the shared promise line still renders).
 */
export function migrationDescriptionBullets(
  shopVersion: string
): DescriptionBullet[] {
  return migrationHopMajors(shopVersion).flatMap(
    (major) => HOP_DESCRIPTION_KEYS[major] ?? []
  )
}

export function stepStatusKey(status: MigrationStepStatus): string {
  return STATUS_LABEL_KEY[status]
}

/**
 * The rows the wizard grid renders.
 *
 * Idle runs show a static grid seeded from the resolved plan chain; once the
 * orchestrator takes over, the store is the source of truth. Declining a
 * backup pins the backup row to done/Skipped in both phases — the run still
 * loads the shop into memory at that step, but nothing is written, so from
 * the user's point of view the backup was simply skipped.
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
