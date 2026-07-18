import { describe, expect, it } from 'vitest'
import { SHEET_HEADERS } from '@/Config/schema'
import {
  IN_MEMORY_WORKBOOK_ID,
  InMemoryWorkbookRepository,
} from '@/Migration/InMemoryWorkbookRepository'

const WB = IN_MEMORY_WORKBOOK_ID

describe('InMemoryWorkbookRepository', () => {
  it('round-trips a loaded sheet', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.load('tags', [['id', 'name'], ['T1', 'Urgent']])
    expect(await repo.readSheetMatrix(WB, 'tags')).toEqual([
      ['id', 'name'],
      ['T1', 'Urgent'],
    ])
  })

  it('deep-copies at every boundary so callers cannot alias its state', async () => {
    const repo = new InMemoryWorkbookRepository()
    const seeded = [['id'], ['T1']]
    repo.load('tags', seeded)
    seeded[1][0] = 'mutated-input'

    const read = await repo.readSheetMatrix(WB, 'tags')
    read[0][0] = 'mutated-output'

    expect(await repo.readSheetMatrix(WB, 'tags')).toEqual([['id'], ['T1']])
  })

  it('throws when reading a sheet that was never loaded', async () => {
    const repo = new InMemoryWorkbookRepository()
    await expect(repo.readSheetMatrix(WB, 'audit_log')).rejects.toThrow(
      "Missing sheet 'audit_log'"
    )
  })

  it('replaces a sheet with an isolated copy', async () => {
    const repo = new InMemoryWorkbookRepository()
    const replacement = [['id'], ['T2']]
    await repo.replaceSheetMatrix(WB, 'tags', replacement)
    replacement[1][0] = 'mutated'
    expect(await repo.readSheetMatrix(WB, 'tags')).toEqual([['id'], ['T2']])
  })

  it('lists the sheets it holds', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.load('tags', [['id']])
    repo.load('jobs', [['id']])
    expect(await repo.getSheetNames(WB)).toEqual(['tags', 'jobs'])
  })

  it('reads the header row, empty for a sheet with no rows', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.load('tags', [['id', 'name']])
    repo.load('jobs', [])
    expect(await repo.getHeaderRow(WB, 'tags')).toEqual(['id', 'name'])
    expect(await repo.getHeaderRow(WB, 'jobs')).toEqual([])
  })

  it('hands the persist pass isolated copies of every sheet', async () => {
    const repo = new InMemoryWorkbookRepository()
    repo.load('tags', [['id'], ['T1']])
    const entries = repo.entries()
    expect(entries).toEqual([['tags', [['id'], ['T1']]]])
    entries[0][1][1][0] = 'mutated'
    expect(await repo.readSheetMatrix(WB, 'tags')).toEqual([['id'], ['T1']])
  })

  it('refuses to create workbooks — migrations only upgrade existing shops', async () => {
    const repo = new InMemoryWorkbookRepository()
    await expect(repo.createWorkbook()).rejects.toThrow(
      'cannot create workbooks'
    )
  })

  it('ensures an absent sheet with its canonical header, never overwriting', async () => {
    const repo = new InMemoryWorkbookRepository()
    await repo.ensureSheet(WB, 'audit_log')
    expect(await repo.readSheetMatrix(WB, 'audit_log')).toEqual([
      [...SHEET_HEADERS.audit_log],
    ])

    await repo.replaceSheetMatrix(WB, 'audit_log', [
      [...SHEET_HEADERS.audit_log],
      ['AL1'],
    ])
    await repo.ensureSheet(WB, 'audit_log')
    expect(await repo.readSheetMatrix(WB, 'audit_log')).toHaveLength(2)
  })
})
