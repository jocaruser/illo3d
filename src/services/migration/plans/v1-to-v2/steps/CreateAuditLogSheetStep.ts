import { SHEET_NAMES, type SheetName } from '@/services/sheets/config'
import type { MigrationContext } from '@/services/migration/MigrationContext'
import {
  MigrationStep,
  type ProgressReporter,
} from '@/services/migration/MigrationStep'
import type { AuditEntityName, AuditEntry } from '@/types/money'

type DataSheetName = Exclude<SheetName, 'audit_log'>

const DATA_SHEETS = SHEET_NAMES.filter(
  (name) => name !== 'audit_log'
) as DataSheetName[]

const ENTITY_NAME_BY_SHEET: Record<DataSheetName, AuditEntityName> = {
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

export class CreateAuditLogSheetStep extends MigrationStep {
  readonly id = 'audit_log'
  readonly label = 'audit_log'

  protected async migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    report.update('wizard.migrationStepCreatingAuditLog')
    await ctx.ensureSheet('audit_log')

    report.update('wizard.migrationStepRecordingExisting')
    const timestamp = new Date().toISOString()
    for (const sheetName of DATA_SHEETS) {
      const rows = await ctx.repo.readRows<Record<string, unknown>>(
        ctx.workingSpreadsheetId,
        sheetName
      )
      const entries = rows
        .filter((row) => typeof row.id === 'string' && row.id !== '')
        .map((row) => baselineEntry(sheetName, row, timestamp))
      await ctx.repo.appendRows(ctx.workingSpreadsheetId, 'audit_log', entries)
    }
  }
}

function baselineEntry(
  sheetName: DataSheetName,
  row: Record<string, unknown>,
  timestamp: string
): AuditEntry & Record<string, unknown> {
  return {
    id: crypto.randomUUID(),
    timestamp,
    actor: 'migration',
    entity_name: ENTITY_NAME_BY_SHEET[sheetName],
    entity_id: String(row.id),
    action: 'migration',
    before_json: '',
    after_json: JSON.stringify(row),
    fieldsChanged: '',
    parent_entity_name: '',
    parent_entity_id: '',
  }
}
