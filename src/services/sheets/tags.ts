import { getSheetsRepository } from './repository'
import type { Tag } from '@/types/money'
import type { SheetName } from './config'

export async function fetchTags(spreadsheetId: string): Promise<Tag[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Tag>(spreadsheetId, 'tags' as SheetName)
  return rows.filter((r) => r.id?.trim() && r.name?.trim())
}
