import { patchWorkbookTab } from './patchTab'
import {
  appendHistoryRow,
  snapshotRowAfter,
  type EntityType,
} from '@/services/history'
import type { SheetName } from '@/services/sheets/config'

export interface MutationContext {
  entityType: EntityType
  entityId: string
  beforeSnapshot: string
}

/**
 * Centralized mutation wrapper that captures history automatically.
 * Services should use this instead of patchWorkbookTab directly
 * when they want history tracking.
 * 
 * Usage:
 * ```ts
 * await mutateWithHistory({
 *   sheetName: 'jobs',
 *   entityType: 'job',
 *   entityId: jobId,
 *   beforeSnapshot: snapshotRowBefore('job', existingJob),
 *   updater: (matrix) => updateDataRowById('jobs', matrix, jobId, updatedJob)
 * })
 * ```
 */
export async function mutateWithHistory({
  sheetName,
  entityType,
  entityId,
  beforeSnapshot,
  updater,
}: {
  sheetName: SheetName
  entityType: EntityType
  entityId: string
  beforeSnapshot: string
  updater: (matrix: string[][]) => string[][]
}): Promise<void> {
  // Apply the mutation
  patchWorkbookTab(sheetName, updater)

  // Capture after snapshot (we need to read the current state after mutation)
  // Since patchWorkbookTab updates the store synchronously, we can read it back
  const { tabs } = await import('@/stores/workbookStore').then((m) =>
    m.useWorkbookStore.getState()
  )
  const matrix = tabs[sheetName]
  if (!matrix || matrix.length === 0) {
    // No data to snapshot - entity was deleted or never existed
    await appendHistoryRow({
      entityType,
      entityId,
      rawDataBefore: beforeSnapshot,
      rawDataAfter: JSON.stringify({ _entityType: entityType, _deleted: true }),
    })
    return
  }

  // Find the updated row to snapshot
  const headerRow = matrix[0]
  const idIndex = headerRow?.indexOf('id') ?? -1
  const dataRow = matrix.find((row, idx) => idx > 0 && row[idIndex] === entityId)

  const afterSnapshot = dataRow
    ? snapshotRowAfter(
        entityType,
        Object.fromEntries(headerRow.map((h, i) => [h, dataRow[i] ?? '']))
      )
    : JSON.stringify({ _entityType: entityType, _deleted: true })

  // Append history row
  await appendHistoryRow({
    entityType,
    entityId,
    rawDataBefore: beforeSnapshot,
    rawDataAfter: afterSnapshot,
  })
}
