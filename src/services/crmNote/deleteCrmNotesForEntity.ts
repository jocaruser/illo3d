import { getSheetsRepository } from '@/services/sheets/repository'
import type { SheetName } from '@/services/sheets/config'

/**
 * Deletes every `crm_notes` row for the given entity scope.
 * Use from delete flows for any entity type that stores notes in this sheet
 * (e.g. `client`, `job`; future types only need matching `entity_type` values in data).
 */
export async function deleteCrmNotesForEntity(
  spreadsheetId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  const repo = getSheetsRepository()
  const typeKey = entityType.trim()
  const idKey = entityId.trim()
  const rows = await repo.readRows<{ entity_type?: string; entity_id?: string }>(
    spreadsheetId,
    'crm_notes' as SheetName
  )
  const indices = rows.reduce<number[]>((acc, n, i) => {
    if (
      String(n.entity_type ?? '').trim() === typeKey &&
      String(n.entity_id ?? '').trim() === idKey
    ) {
      acc.push(i)
    }
    return acc
  }, [])
  for (const i of [...indices].sort((a, b) => b - a)) {
    await repo.deleteRow(spreadsheetId, 'crm_notes' as SheetName, i + 1)
  }
}
