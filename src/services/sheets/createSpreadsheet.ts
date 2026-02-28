import {
  SPREADSHEET_NAME,
  SHEET_NAMES,
  SHEET_HEADERS,
  type SheetName,
} from './config'
import { sheetsFetch } from './client'

export async function createSpreadsheet(accessToken: string): Promise<string> {
  const createResponse = await sheetsFetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        properties: { title: SPREADSHEET_NAME },
        sheets: SHEET_NAMES.map((sheetName) => ({
          properties: { title: sheetName },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: (SHEET_HEADERS[sheetName] as readonly string[]).map(
                    (header) => ({
                      userEnteredValue: { stringValue: header },
                    })
                  ),
                },
              ],
            },
          ],
        })),
      }),
    }
  )

  if (!createResponse.ok) {
    const error = await createResponse.json().catch(() => ({}))
    throw new Error(
      error.error?.message || `Failed to create spreadsheet: ${createResponse.status}`
    )
  }

  const result = await createResponse.json()
  const spreadsheetId = result.spreadsheetId
  if (!spreadsheetId) {
    throw new Error('No spreadsheet ID in create response')
  }
  return spreadsheetId
}
