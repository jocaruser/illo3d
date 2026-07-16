import { describe, expect, it } from 'vitest'
import { SHEET_HEADERS, SHEET_NAMES } from '@/Config/schema'
import { serializeCsv } from '@/Repository/LocalCsv/Csv'
import { LocalCsvWorkbookRepository } from '@/Repository/LocalCsv/LocalCsvWorkbookRepository'
import { createFakeDirectory } from './fakeDirectoryHandle'

const WORKBOOK_ID = 'local-shop'

describe('LocalCsvWorkbookRepository', () => {
  it('reads a sheet matrix from its CSV file', async () => {
    const { handle } = createFakeDirectory('shop', {
      'tags.csv':
        'id,name,created_at,archived,deleted\r\nT1,3d,2026-01-01,,\r\n',
    })
    const repository = new LocalCsvWorkbookRepository(handle)
    expect(await repository.readSheetMatrix(WORKBOOK_ID, 'tags')).toEqual([
      ['id', 'name', 'created_at', 'archived', 'deleted'],
      ['T1', '3d', '2026-01-01', '', ''],
    ])
  })

  it('rejects when the sheet file is missing', async () => {
    const repository = new LocalCsvWorkbookRepository(
      createFakeDirectory().handle
    )
    await expect(
      repository.readSheetMatrix(WORKBOOK_ID, 'tags')
    ).rejects.toThrow('tags.csv')
  })

  it('replaces a sheet by rewriting its file, round-tripping JSON cells', async () => {
    const { handle, files } = createFakeDirectory()
    const repository = new LocalCsvWorkbookRepository(handle)
    const matrix = [
      [...SHEET_HEADERS.audit_log],
      [
        'AL1',
        '2026-01-01T00:00:00Z',
        'local',
        'client',
        'CL1',
        'update',
        '{"name":"Acme, Inc.","quote":"\\"hi\\""}',
        '{"name":"Acme"}',
        'name',
        '',
        '',
      ],
    ]
    await repository.replaceSheetMatrix(WORKBOOK_ID, 'audit_log', matrix)
    expect(files.get('audit_log.csv')).toBe(serializeCsv(matrix))
    expect(await repository.readSheetMatrix(WORKBOOK_ID, 'audit_log')).toEqual(
      matrix
    )
  })

  it('lists only canonical sheet CSV files', async () => {
    const { handle } = createFakeDirectory('shop', {
      'clients.csv': '',
      'jobs.csv': '',
      'random.csv': '',
      'notes.txt': '',
      'illo3d.metadata.json': '{}',
    })
    const repository = new LocalCsvWorkbookRepository(handle)
    expect(await repository.getSheetNames(WORKBOOK_ID)).toEqual([
      'clients',
      'jobs',
    ])
  })

  it('reads the header row of a sheet', async () => {
    const { handle } = createFakeDirectory('shop', {
      'clients.csv': 'id,name\r\nCL1,Acme\r\n',
    })
    const repository = new LocalCsvWorkbookRepository(handle)
    expect(await repository.getHeaderRow(WORKBOOK_ID, 'clients')).toEqual([
      'id',
      'name',
    ])
  })

  it('returns an empty header row for an empty file', async () => {
    const { handle } = createFakeDirectory('shop', { 'clients.csv': '' })
    const repository = new LocalCsvWorkbookRepository(handle)
    expect(await repository.getHeaderRow(WORKBOOK_ID, 'clients')).toEqual([])
  })

  it('creates every canonical sheet as a header-only CSV and returns the synthetic id', async () => {
    const { handle, files } = createFakeDirectory('my-shop')
    const repository = new LocalCsvWorkbookRepository(handle)
    expect(await repository.createWorkbook()).toBe('local-my-shop')
    expect([...files.keys()]).toEqual(
      SHEET_NAMES.map((sheet) => `${sheet}.csv`)
    )
    for (const sheet of SHEET_NAMES) {
      expect(files.get(`${sheet}.csv`)).toBe(
        serializeCsv([[...SHEET_HEADERS[sheet]]])
      )
    }
  })

  it('ensureSheet creates a missing sheet with its canonical header', async () => {
    const { handle, files } = createFakeDirectory()
    const repository = new LocalCsvWorkbookRepository(handle)
    await repository.ensureSheet(WORKBOOK_ID, 'jobs')
    expect(files.get('jobs.csv')).toBe(serializeCsv([[...SHEET_HEADERS.jobs]]))
  })

  it('ensureSheet leaves an existing sheet untouched', async () => {
    const existing = 'id,client_id\r\nJ1,CL1\r\n'
    const { handle, files } = createFakeDirectory('shop', {
      'jobs.csv': existing,
    })
    const repository = new LocalCsvWorkbookRepository(handle)
    await repository.ensureSheet(WORKBOOK_ID, 'jobs')
    expect(files.get('jobs.csv')).toBe(existing)
  })
})
