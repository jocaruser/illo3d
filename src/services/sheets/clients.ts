import { readSheetRows } from './read'
import type { Client } from '@/types/money'
import type { SheetName } from './config'

export async function fetchClients(
  spreadsheetId: string,
  getAccessToken: () => Promise<string>
): Promise<Client[]> {
  const accessToken = await getAccessToken()
  return readSheetRows<Client>(
    spreadsheetId,
    'clients' as SheetName,
    accessToken
  )
}
