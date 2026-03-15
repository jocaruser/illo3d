import { SHEET_NAMES, SHEET_HEADERS, type SheetName } from './config'
import { getSheetsRepository } from './repository'

export interface ValidationError {
  sheet?: string
  message: string
}

export async function validateStructure(
  spreadsheetId: string
): Promise<ValidationError[]> {
  const repository = getSheetsRepository()
  const errors: ValidationError[] = []

  const existingSheets = await repository.getSheetNames(spreadsheetId)

  for (const sheetName of SHEET_NAMES) {
    if (!existingSheets.includes(sheetName)) {
      errors.push({ sheet: sheetName, message: `Missing sheet: ${sheetName}` })
      continue
    }

    const headers = await repository.getHeaderRow(spreadsheetId, sheetName)
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
