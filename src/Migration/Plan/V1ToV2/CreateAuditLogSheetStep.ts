import { DATA_SHEET_NAMES, type SheetName } from '@/Config/schema'
import { AuditEntry, type AuditEntityName } from '@/Entity/AuditEntry'
import type { SheetRecord } from '@/Entity/SheetEntity'
import type { MigrationContext } from '@/Migration/MigrationContext'
import { MigrationStep, type ProgressReporter } from '@/Migration/MigrationStep'
import { appendRecord, matrixToRecords } from '@/Repository/Matrix'
import { isoInstant, SystemClock, type Clock } from '@/Service/Clock'
import { nextId } from '@/Service/IdGenerator'

type DataSheetName = Exclude<SheetName, 'audit_log'>

const AUDIT_ENTITY_BY_SHEET: Record<DataSheetName, AuditEntityName> = {
  clients: 'client',
  crm_notes: 'crm_note',
  tags: 'tag',
  tag_links: 'tag_link',
  jobs: 'job',
  pieces: 'piece',
  piece_items: 'piece_item',
  inventory: 'inventory',
  lots: 'lot',
  transactions: 'transaction',
}

/** Row snapshot for `after_json`: drop lifecycle columns that are still empty. */
function baselineSnapshot(record: SheetRecord): SheetRecord {
  const snapshot = { ...record }
  if (snapshot.archived === '') delete snapshot.archived
  if (snapshot.deleted === '') delete snapshot.deleted
  return snapshot
}

/**
 * v1 → v2: create the `audit_log` sheet and backfill one baseline `migration`
 * entry per existing row, so every row has an auditable starting point.
 * Idempotent: a log that already carries entries is left untouched.
 */
export class CreateAuditLogSheetStep extends MigrationStep {
  readonly id = 'audit_log'

  constructor(private readonly clock: Clock = new SystemClock()) {
    super()
  }

  async migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    report.update('wizard.migrationStepAuditSheet')
    await ctx.ensureSheet('audit_log')
    let auditMatrix = await ctx.repo.readSheetMatrix(
      ctx.workingWorkbookId,
      'audit_log'
    )
    if (auditMatrix.length > 1) return

    report.update('wizard.migrationStepAuditBackfill')
    const usedIds: string[] = []
    for (const sheet of DATA_SHEET_NAMES as readonly DataSheetName[]) {
      const matrix = await ctx.repo.readSheetMatrix(
        ctx.workingWorkbookId,
        sheet
      )
      for (const record of matrixToRecords(sheet, matrix)) {
        if (record.id.trim() === '') continue
        const entry = new AuditEntry()
        entry.id = nextId('AL', usedIds)
        usedIds.push(entry.id)
        entry.timestamp = isoInstant(this.clock)
        entry.actor = 'migration'
        entry.action = 'migration'
        entry.entityName = AUDIT_ENTITY_BY_SHEET[sheet]
        entry.entityId = record.id
        entry.afterJson = JSON.stringify(baselineSnapshot(record))
        auditMatrix = appendRecord('audit_log', auditMatrix, entry.toRecord())
      }
    }
    await ctx.repo.replaceSheetMatrix(
      ctx.workingWorkbookId,
      'audit_log',
      auditMatrix
    )
  }
}
