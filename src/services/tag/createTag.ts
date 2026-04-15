import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import type { SheetName } from '@/services/sheets/config'

export async function createTag(
  spreadsheetId: string,
  name: string
): Promise<string> {
  const normalized = formatTagNameTitleCase(name)
  if (!normalized) {
    throw new Error('Tag name is required')
  }
  const repo = getSheetsRepository()
  const existing = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'tags' as SheetName
  )
  const id = nextNumericId(
    'TG',
    existing.map((r) => r.id).filter((x): x is string => x != null)
  )
  const created_at = new Date().toISOString()
  await repo.appendRows(spreadsheetId, 'tags' as SheetName, [
    { id, name: normalized, created_at },
  ])
  return id
}
