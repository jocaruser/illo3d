import { STORAGE_KEY_SPREADSHEET_ID } from './config'
import { getAccessToken } from './client'
import { createSpreadsheet } from './createSpreadsheet'
import { validateStructure } from './validateStructure'

export type ConnectionResult =
  | { ok: true; spreadsheetId: string }
  | { ok: false; error: string; details?: string }

export async function connect(): Promise<ConnectionResult> {
  try {
    const storedId = localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID)
    let spreadsheetId: string

    const accessToken = await getAccessToken()

    if (storedId) {
      const validationErrors = await validateStructure(storedId, accessToken)
      if (validationErrors.length > 0) {
        return {
          ok: false,
          error: 'Invalid spreadsheet structure',
          details: validationErrors.map((e) => e.message).join('; '),
        }
      }
      spreadsheetId = storedId
    } else {
      spreadsheetId = await createSpreadsheet(accessToken)
      localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, spreadsheetId)
    }

    return { ok: true, spreadsheetId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return { ok: false, error: message }
  }
}
