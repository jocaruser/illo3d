import { getSheetsRepository } from '@/services/sheets/repository'
import type { SheetName } from '@/services/sheets/config'

export async function deleteClientNote(
  spreadsheetId: string,
  noteId: string
): Promise<void> {
  const repo = getSheetsRepository()
  const notes = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'crm_notes' as SheetName
  )
  const matches = notes.reduce<number[]>((acc, n, i) => {
    if (n.id?.trim() === noteId) acc.push(i)
    return acc
  }, [])
  const idx = matches.length ? matches[matches.length - 1] : -1
  if (idx === -1) {
    throw new Error(`Client note ${noteId} not found`)
  }
  await repo.deleteRow(spreadsheetId, 'crm_notes' as SheetName, idx + 1)
}
