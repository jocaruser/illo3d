import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SHEET_HEADERS, SHEET_NAMES } from '@/Config/schema'
import { GSheetWorkbookRepository } from '@/Repository/GSheet/GSheetWorkbookRepository'

const { sheetsFetchMock } = vi.hoisted(() => ({ sheetsFetchMock: vi.fn() }))

vi.mock('@/Repository/GSheet/GoogleApiClient', () => ({
  sheetsFetch: sheetsFetchMock,
}))

function jsonResponse(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as Response
}

const repository = new GSheetWorkbookRepository()

const clientsRange = encodeURIComponent("'clients'!A:ZZ")

beforeEach(() => {
  sheetsFetchMock.mockReset()
  sheetsFetchMock.mockResolvedValue(jsonResponse({}))
})

describe('readSheetMatrix', () => {
  it('reads the full sheet range as rows', async () => {
    const values = [
      ['id', 'name'],
      ['CL1', 'Acme'],
    ]
    sheetsFetchMock.mockResolvedValue(jsonResponse({ values }))
    expect(await repository.readSheetMatrix('S1', 'clients')).toEqual(values)
    expect(sheetsFetchMock).toHaveBeenCalledWith(
      `/spreadsheets/S1/values/${clientsRange}?majorDimension=ROWS`
    )
  })

  it('returns [[]] when the response has no values', async () => {
    expect(await repository.readSheetMatrix('S1', 'clients')).toEqual([[]])
  })
})

describe('replaceSheetMatrix', () => {
  it('clears the range then writes the matrix RAW at A1', async () => {
    const matrix = [
      ['id', 'name'],
      ['CL1', 'Acme'],
    ]
    await repository.replaceSheetMatrix('S1', 'clients', matrix)
    expect(sheetsFetchMock).toHaveBeenNthCalledWith(
      1,
      `/spreadsheets/S1/values/${clientsRange}:clear`,
      { method: 'POST' }
    )
    expect(sheetsFetchMock).toHaveBeenNthCalledWith(
      2,
      `/spreadsheets/S1/values/${encodeURIComponent("'clients'!A1")}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          range: "'clients'!A1",
          majorDimension: 'ROWS',
          values: matrix,
        }),
      }
    )
  })
})

describe('getSheetNames', () => {
  it('maps tab titles from the spreadsheet properties', async () => {
    sheetsFetchMock.mockResolvedValue(
      jsonResponse({
        sheets: [{ properties: { title: 'clients' } }, { properties: {} }, {}],
      })
    )
    expect(await repository.getSheetNames('S1')).toEqual(['clients', '', ''])
    expect(sheetsFetchMock).toHaveBeenCalledWith(
      '/spreadsheets/S1?fields=sheets.properties.title'
    )
  })

  it('returns an empty list when the response has no sheets', async () => {
    expect(await repository.getSheetNames('S1')).toEqual([])
  })
})

describe('getHeaderRow', () => {
  it('reads row 1 of the sheet', async () => {
    sheetsFetchMock.mockResolvedValue(
      jsonResponse({ values: [['id', 'name']] })
    )
    expect(await repository.getHeaderRow('S1', 'clients')).toEqual([
      'id',
      'name',
    ])
    expect(sheetsFetchMock).toHaveBeenCalledWith(
      `/spreadsheets/S1/values/${encodeURIComponent("'clients'!1:1")}`
    )
  })

  it('returns an empty row when values are missing', async () => {
    expect(await repository.getHeaderRow('S1', 'clients')).toEqual([])
  })

  it('returns an empty row when values are empty', async () => {
    sheetsFetchMock.mockResolvedValue(jsonResponse({ values: [] }))
    expect(await repository.getHeaderRow('S1', 'clients')).toEqual([])
  })
})

describe('createWorkbook', () => {
  it('creates the spreadsheet with every canonical tab then writes headers', async () => {
    sheetsFetchMock.mockResolvedValueOnce(
      jsonResponse({ spreadsheetId: 'NEW1' })
    )
    expect(await repository.createWorkbook()).toBe('NEW1')
    expect(sheetsFetchMock).toHaveBeenNthCalledWith(1, '/spreadsheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title: 'illo3d-data' },
        sheets: SHEET_NAMES.map((title) => ({ properties: { title } })),
      }),
    })
    expect(sheetsFetchMock).toHaveBeenCalledTimes(1 + SHEET_NAMES.length)
    SHEET_NAMES.forEach((sheet, index) => {
      expect(sheetsFetchMock).toHaveBeenNthCalledWith(
        index + 2,
        `/spreadsheets/NEW1/values/${encodeURIComponent(`'${sheet}'!A1`)}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            range: `'${sheet}'!A1`,
            majorDimension: 'ROWS',
            values: [[...SHEET_HEADERS[sheet]]],
          }),
        }
      )
    })
  })

  it('falls back to an empty id when the response omits it', async () => {
    expect(await repository.createWorkbook()).toBe('')
  })
})

describe('ensureSheet', () => {
  it('adds the tab via batchUpdate and writes the canonical header', async () => {
    await repository.ensureSheet('S1', 'audit_log')
    expect(sheetsFetchMock).toHaveBeenNthCalledWith(
      1,
      '/spreadsheets/S1:batchUpdate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'audit_log' } } }],
        }),
      }
    )
    expect(sheetsFetchMock).toHaveBeenNthCalledWith(
      2,
      `/spreadsheets/S1/values/${encodeURIComponent("'audit_log'!A1")}?valueInputOption=RAW`,
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('tolerates an already-existing tab and still writes the header', async () => {
    sheetsFetchMock.mockRejectedValueOnce(
      new Error(
        'Google API request failed (400): sheet "audit_log" already exists'
      )
    )
    await repository.ensureSheet('S1', 'audit_log')
    expect(sheetsFetchMock).toHaveBeenCalledTimes(2)
  })

  it('rethrows other errors', async () => {
    sheetsFetchMock.mockRejectedValueOnce(
      new Error('Google API request failed (500): boom')
    )
    await expect(repository.ensureSheet('S1', 'audit_log')).rejects.toThrow(
      'boom'
    )
    expect(sheetsFetchMock).toHaveBeenCalledTimes(1)
  })

  it('rethrows non-Error rejections', async () => {
    sheetsFetchMock.mockRejectedValueOnce('already exists')
    await expect(repository.ensureSheet('S1', 'audit_log')).rejects.toBe(
      'already exists'
    )
  })
})
