import { getSheetsRepository } from '@/services/sheets/repository'
import type { ClientNote } from '@/types/money'
import type { SheetName } from '@/services/sheets/config'

export async function deleteClientNote(
  spreadsheetId: string,
  noteId: string
): Promise<void> {
  const repo = getSheetsRepository()
  const notes = await repo.readRows<ClientNote>(
    spreadsheetId,
    'client_notes' as SheetName
  )
  const idx = notes.findIndex((n) => n.id === noteId)
  if (idx === -1) {
    throw new Error(`Client note ${noteId} not found`)
  }
  await repo.deleteRow(spreadsheetId, 'client_notes' as SheetName, idx + 1)
}
