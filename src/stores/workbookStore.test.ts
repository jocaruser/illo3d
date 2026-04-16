import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkbookStore } from './workbookStore'
import type { SheetsRepository } from '@/services/sheets/repository'
import type { SheetName } from '@/services/sheets/config'
import { SHEET_NAMES } from '@/services/sheets/config'
import { emptySheetMatrix } from '@/services/sheets/sheetMatrix'

function headerPlusRow(sheetName: SheetName, row: string[]): string[][] {
  const h = emptySheetMatrix(sheetName)[0]
  const width = h.length
  const padded = row.slice(0, width)
  while (padded.length < width) padded.push('')
  return [h, padded]
}

function createMockRepo(overrides: Partial<SheetsRepository> = {}): SheetsRepository {
  const matrices: Partial<Record<SheetName, string[][]>> = {}
  for (const name of SHEET_NAMES) {
    matrices[name] = emptySheetMatrix(name)
  }
  matrices.clients = headerPlusRow('clients', [
    'c1',
    'Acme',
    '',
    '',
    '',
    '',
    '',
    '',
    '2025-01-01',
    '',
    '',
  ])
  return {
    readRows: vi.fn(),
    appendRows: vi.fn(),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
    getSheetNames: vi.fn(),
    getHeaderRow: vi.fn(),
    createSpreadsheet: vi.fn(),
    readSheetMatrix: vi.fn(async (_id: string, name: SheetName) => matrices[name]!),
    replaceSheetMatrix: vi.fn(
      async (_id: string, name: SheetName, matrix: string[][]) => {
        matrices[name] = matrix
      }
    ),
    getSheetIdMap: vi.fn(async () => ({})),
    ...overrides,
  }
}

describe('useWorkbookStore', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('hydrate loads tabs and clears dirty', async () => {
    const repo = createMockRepo()
    await useWorkbookStore.getState().hydrate(repo, 'sheet-1')

    const s = useWorkbookStore.getState()
    expect(s.status).toBe('ready')
    expect(s.dirty).toBe(false)
    expect(s.spreadsheetId).toBe('sheet-1')
    expect(s.tabs.clients?.length).toBeGreaterThan(1)
    expect(repo.readSheetMatrix).toHaveBeenCalled()
  })

  it('hydrate sets error when read fails', async () => {
    const repo = createMockRepo({
      readSheetMatrix: vi.fn(async () => {
        throw new Error('network')
      }),
    })
    await useWorkbookStore.getState().hydrate(repo, 'sheet-1')

    expect(useWorkbookStore.getState().status).toBe('error')
    expect(useWorkbookStore.getState().error).toBe('network')
  })

  it('mutateTab sets dirty', () => {
    useWorkbookStore.setState({
      tabs: { clients: emptySheetMatrix('clients') },
      spreadsheetId: 'x',
      status: 'ready',
    })
    useWorkbookStore.getState().mutateTab('clients', headerPlusRow('clients', []))

    expect(useWorkbookStore.getState().dirty).toBe(true)
  })

  it('save writes all tabs via replaceSheetMatrix', async () => {
    const repo = createMockRepo()
    await useWorkbookStore.getState().hydrate(repo, 'sheet-1')
    useWorkbookStore.getState().mutateTab('jobs', headerPlusRow('jobs', []))
    await useWorkbookStore.getState().save(repo)

    expect(repo.replaceSheetMatrix).toHaveBeenCalled()
    expect(useWorkbookStore.getState().dirty).toBe(false)
  })

  it('refresh reloads from repository', async () => {
    const repo = createMockRepo()
    await useWorkbookStore.getState().hydrate(repo, 'sheet-1')
    useWorkbookStore.setState({ dirty: true })
    await useWorkbookStore.getState().refresh(repo)

    expect(useWorkbookStore.getState().dirty).toBe(false)
    expect(useWorkbookStore.getState().status).toBe('ready')
  })

  it('reset clears state', async () => {
    const repo = createMockRepo()
    await useWorkbookStore.getState().hydrate(repo, 'sheet-1')
    useWorkbookStore.getState().reset()

    const s = useWorkbookStore.getState()
    expect(s.spreadsheetId).toBeNull()
    expect(s.status).toBe('idle')
    expect(Object.keys(s.tabs)).toHaveLength(0)
  })
})
