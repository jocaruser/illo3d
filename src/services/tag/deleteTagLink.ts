import { getSheetsRepository } from '@/services/sheets/repository'
import type { SheetName } from '@/services/sheets/config'

export async function deleteTagLink(
  spreadsheetId: string,
  linkId: string
): Promise<void> {
  const repo = getSheetsRepository()
  const links = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'tag_links' as SheetName
  )
  const idx = links.findIndex((l) => l.id === linkId)
  if (idx === -1) {
    throw new Error(`Tag link ${linkId} not found`)
  }
  await repo.deleteRow(spreadsheetId, 'tag_links' as SheetName, idx + 1)
}
