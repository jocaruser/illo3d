import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { nextNumericId } from '@/utils/id'

export type EntityType =
  | 'job'
  | 'piece'
  | 'piece_item'
  | 'client'
  | 'transaction'
  | 'inventory'
  | 'lot'
  | 'tag'
  | 'tag_link'
  | 'crm_note'

export interface HistoryPayload {
  entityType: EntityType
  entityId: string
  rawDataBefore: string
  rawDataAfter: string
  changedBy?: string
}

/**
 * Appends a history row to the history sheet with raw data snapshots.
 * Called automatically on every entity mutation.
 */
export async function appendHistoryRow(payload: HistoryPayload): Promise<void> {
  const historyId = nextNumericId('H', [])
  const changedAt = new Date().toISOString()
  const changedBy = payload.changedBy ?? 'system'

  patchWorkbookTab('history', (m) =>
    appendDataRow('history', m, {
      id: historyId,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      raw_data_before: payload.rawDataBefore,
      raw_data_after: payload.rawDataAfter,
      changed_at: changedAt,
      changed_by: changedBy,
    }),
  )
}
