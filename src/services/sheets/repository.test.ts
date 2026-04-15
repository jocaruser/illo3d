import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CsvSheetsRepository } from './repository'

const mockFetch = vi.fn()

describe('CsvSheetsRepository', () => {
  beforeEach(() => {
    mockFetch.mockClear()
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
    expect(names).toContain('crm_notes')
    expect(names).toContain('tags')
    expect(names).toContain('tag_links')
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

  it('appendRows calls /api/sheets/append with folder, sheetName, rows', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const repo = new CsvSheetsRepository('happy-path')
    await repo.appendRows('csv-fixture-happy-path', 'expenses', [
      { id: 'E1', date: '2025-01-20', category: 'electric', amount: 50, notes: '' },
    ])

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sheets/append',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: 'csv-fixture-happy-path',
          folder: 'happy-path',
          sheetName: 'expenses',
          rows: [
            { id: 'E1', date: '2025-01-20', category: 'electric', amount: 50, notes: '' },
          ],
        }),
      })
    )
  })

  it('appendRows does nothing when rows is empty', async () => {
    const repo = new CsvSheetsRepository('happy-path')
    await repo.appendRows('csv-fixture-happy-path', 'expenses', [])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('deleteRow calls /api/sheets/row with DELETE', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const repo = new CsvSheetsRepository('happy-path')
    await repo.deleteRow('csv-fixture-happy-path', 'clients', 2)

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sheets/row',
      expect.objectContaining({
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: 'csv-fixture-happy-path',
          folder: 'happy-path',
          sheetName: 'clients',
          rowIndex: 2,
        }),
      })
    )
  })

  it('updateRow calls /api/sheets/row with PUT', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const repo = new CsvSheetsRepository('happy-path')
    await repo.updateRow('csv-fixture-happy-path', 'jobs', 1, {
      id: 'J1',
      client_id: 'CL1',
      description: 'x',
      status: 'paid',
      price: 10,
      created_at: '2025-01-01',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sheets/row',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: 'csv-fixture-happy-path',
          folder: 'happy-path',
          sheetName: 'jobs',
          rowIndex: 1,
          row: {
            id: 'J1',
            client_id: 'CL1',
            description: 'x',
            status: 'paid',
            price: 10,
            created_at: '2025-01-01',
          },
        }),
      })
    )
  })

  it('does not parse quoted commas: split(",") treats "Acme, Inc." as two columns', async () => {
    // Fixtures must not use embedded commas inside quoted values.
    // See public/fixtures/README.md for the fixture convention.
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('id,name\nc1,"Acme, Inc."'),
    })

    const repo = new CsvSheetsRepository('happy-path')
    const rows = await repo.readRows('csv-fixture-happy-path', 'clients')

    // With split(','), "Acme, Inc." becomes two values: '"Acme' and ' Inc."'
    expect(rows[0]).toMatchObject({
      id: 'c1',
      name: '"Acme', // First column only; " Inc."' goes to next header
    })
  })
})
