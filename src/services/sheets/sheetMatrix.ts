import { SHEET_HEADERS, type SheetName } from './config'

export function emptySheetMatrix(sheetName: SheetName): string[][] {
  return [SHEET_HEADERS[sheetName].map(String)]
}

export function padSheetRow(row: unknown[] | undefined, width: number): string[] {
  const arr = (row ?? []).map((c) => String(c ?? '').trim())
  while (arr.length < width) arr.push('')
  return arr.slice(0, width)
}

export function normalizeSheetMatrixFromApi(
  sheetName: SheetName,
  rawRows: unknown[][]
): string[][] {
  const headers = SHEET_HEADERS[sheetName]
  const width = headers.length
  const canonicalHeader = headers.map(String)
  if (!rawRows.length) {
    return [canonicalHeader]
  }
  const normalized = rawRows.map((r) => padSheetRow(r as unknown[], width))
  const dataRows = normalized
    .slice(1)
    .filter((row) => row.some((c) => c !== ''))
  return [canonicalHeader, ...dataRows]
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  result.push(current.trim())
  return result
}

export function normalizeSheetMatrixFromCsvLines(
  sheetName: SheetName,
  lines: string[]
): string[][] {
  const headers = SHEET_HEADERS[sheetName]
  const width = headers.length
  const canonicalHeader = headers.map(String)
  if (lines.length === 0) {
    return [canonicalHeader]
  }
  const normalized = lines.map((line) =>
    padSheetRow(
      parseCsvLine(line),
      width
    )
  )
  const dataRows = normalized
    .slice(1)
    .filter((row) => row.some((c) => c !== ''))
  return [canonicalHeader, ...dataRows]
}
