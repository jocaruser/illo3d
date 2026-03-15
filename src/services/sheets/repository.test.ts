import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CsvSheetsRepository } from './repository'

const mockFetch = vi.fn()

describe('CsvSheetsRepository', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  it('parses CSV and returns objects keyed by headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          'id,date,type,amount,category,concept,ref_type,ref_id,client_id,notes\n' +
            't1,2025-01-15,income,100.50,Sales,Print job A,,,c1,First sale'
        ),
    })

    const repo = new CsvSheetsRepository('happy-path')
    const rows = await repo.readRows('csv-fixture-happy-path', 'transactions')

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 't1',
      date: '2025-01-15',
      type: 'income',
      amount: '100.50',
      category: 'Sales',
      concept: 'Print job A',
      client_id: 'c1',
      notes: 'First sale',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/fixtures/happy-path/transactions.csv'
    )
  })

  it('getSheetNames returns SHEET_NAMES', async () => {
    const repo = new CsvSheetsRepository('happy-path')
    const names = await repo.getSheetNames('csv-fixture-happy-path')
    expect(names).toContain('transactions')
    expect(names).toContain('clients')
    expect(names).toContain('expenses')
  })

  it('getHeaderRow returns first line of CSV as headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          'id,date,type,amount,category,concept,ref_type,ref_id,client_id,notes'
        ),
    })

    const repo = new CsvSheetsRepository('happy-path')
    const headers = await repo.getHeaderRow(
      'csv-fixture-happy-path',
      'transactions'
    )

    expect(headers).toEqual([
      'id',
      'date',
      'type',
      'amount',
      'category',
      'concept',
      'ref_type',
      'ref_id',
      'client_id',
      'notes',
    ])
  })

  it('createSpreadsheet returns csv-dev', async () => {
    const repo = new CsvSheetsRepository()
    const id = await repo.createSpreadsheet()
    expect(id).toBe('csv-dev')
  })

  it('extracts folder from spreadsheetId with csv-fixture- prefix', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('id,name\nc1,Acme'),
    })

    const repo = new CsvSheetsRepository('happy-path')
    await repo.readRows('csv-fixture-missingcolumn', 'clients')

    expect(mockFetch).toHaveBeenCalledWith(
      '/fixtures/missingcolumn/clients.csv'
    )
  })
})
