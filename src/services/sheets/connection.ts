import { getAccessToken } from './client'
import { validateStructure } from './validateStructure'

export type ConnectionResult =
  | { ok: true; spreadsheetId: string }
  | { ok: false; error: string; details?: string }

export async function connect(
  spreadsheetId: string
): Promise<ConnectionResult> {
  try {
    const accessToken = await getAccessToken()
    const validationErrors = await validateStructure(spreadsheetId, accessToken)
    if (validationErrors.length > 0) {
      return {
        ok: false,
        error: 'Invalid spreadsheet structure',
        details: validationErrors.map((e) => e.message).join('; '),
      }
    }
    return { ok: true, spreadsheetId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return { ok: false, error: message }
  }
}
