import { getSheetsRepository } from './repository'
import type { Client } from '@/types/money'
import type { SheetName } from './config'

export async function fetchClients(
  spreadsheetId: string
): Promise<Client[]> {
  const repository = getSheetsRepository()
  return repository.readRows<Client>(
    spreadsheetId,
    'clients' as SheetName
  )
}
