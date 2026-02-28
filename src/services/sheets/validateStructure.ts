import { SHEET_NAMES, SHEET_HEADERS, type SheetName } from './config'
import { sheetsFetch } from './client'

export interface ValidationError {
  sheet?: string
  message: string
}

export async function validateStructure(
  spreadsheetId: string,
  accessToken: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  const metaResponse = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    accessToken
  )

  if (!metaResponse.ok) {
    errors.push({ message: `Failed to fetch spreadsheet: ${metaResponse.status}` })
    return errors
  }

  const meta = await metaResponse.json()
  const existingSheets = (meta.sheets || []).map(
    (s: { properties?: { title?: string } }) => s.properties?.title || ''
  )

  for (const sheetName of SHEET_NAMES) {
    if (!existingSheets.includes(sheetName)) {
      errors.push({ sheet: sheetName, message: `Missing sheet: ${sheetName}` })
      continue
    }

    const range = `'${sheetName}'!1:1`
    const valuesResponse = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      accessToken
    )

    if (!valuesResponse.ok) {
      errors.push({
        sheet: sheetName,
        message: `Failed to read headers: ${valuesResponse.status}`,
      })
      continue
    }

    const valuesData = await valuesResponse.json()
    const headers = valuesData.values?.[0] || []
    const expectedHeaders = SHEET_HEADERS[sheetName as SheetName]

    if (headers.length < expectedHeaders.length) {
      errors.push({
        sheet: sheetName,
        message: `Expected headers: ${expectedHeaders.join(', ')}`,
      })
      continue
    }

    for (let i = 0; i < expectedHeaders.length; i++) {
      const actual = String(headers[i] || '').trim()
      const expected = expectedHeaders[i]
      if (actual !== expected) {
        errors.push({
          sheet: sheetName,
          message: `Column ${i + 1}: expected "${expected}", got "${actual}"`,
        })
      }
    }
  }

  return errors
}
