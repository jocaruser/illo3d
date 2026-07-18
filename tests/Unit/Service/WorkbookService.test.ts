import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SHEET_HEADERS, SHEET_NAMES, type SheetName } from '@/Config/schema'
import { emptyMatrix } from '@/Repository/Matrix'
import type {
  SheetMatrix,
  WorkbookRepositoryInterface,
} from '@/Repository/WorkbookRepositoryInterface'
import { WorkbookService } from '@/Service/WorkbookService'
import { useWorkbookStore } from '@/Store/workbookStore'

const operations = vi.hoisted(() => ({
  start: vi.fn(),
  progress: vi.fn(),
  fail: vi.fn(),
  finish: vi.fn(),
}))

vi.mock('@/Store/operationStore', () => ({
  useOperationStore: { getState: () => operations },
}))

function makeRepo(overrides?: Partial<WorkbookRepositoryInterface>): WorkbookRepositoryInterface {
  return {
    readSheetMatrix: vi.fn(async (_workbookId: string, sheet: SheetName) => {
      const matrix: SheetMatrix = emptyMatrix(sheet)
      if (sheet === 'tags') return [...matrix, ['TG1', 'Vip']]
      return matrix
    }),
    replaceSheetMatrix: vi.fn(async () => {}),
    getSheetNames: vi.fn(async () => [...SHEET_NAMES]),
    getHeaderRow: vi.fn(async (_workbookId: string, sheet: SheetName) => [
      ...SHEET_HEADERS[sheet],
    ]),
    createWorkbook: vi.fn(async () => 'wb-new'),
    ensureSheet: vi.fn(async () => {}),
    ...overrides,
  }
}

beforeEach(() => {
  useWorkbookStore.getState().reset()
  vi.clearAllMocks()
})

describe('hydrate', () => {
  it('reads and normalizes every sheet, then hydrates the store', async () => {
    const repo = makeRepo()
    await new WorkbookService(repo, 'wb-1').hydrate()

    expect(repo.readSheetMatrix).toHaveBeenCalledTimes(SHEET_NAMES.length)
    const state = useWorkbookStore.getState()
    expect(state.status).toBe('ready')
    expect(state.workbookId).toBe('wb-1')
    expect(state.dirty).toBe(false)
    // Normalized: short row padded to canonical width.
    expect(state.tabs.tags[1]).toEqual(['TG1', 'Vip', '', '', ''])

    expect(operations.start).toHaveBeenCalledWith('load', {
      total: SHEET_NAMES.length,
      blocking: false,
      message: 'workbook.loadingWorkbook',
    })
    expect(operations.progress).toHaveBeenCalledTimes(SHEET_NAMES.length)
    expect(operations.progress).toHaveBeenNthCalledWith(1, 1, 'clients')
    expect(operations.progress).toHaveBeenLastCalledWith(SHEET_NAMES.length, 'audit_log')
    expect(operations.finish).toHaveBeenCalledTimes(1)
  })

  it('marks the store error, rethrows and still finishes the operation', async () => {
    const repo = makeRepo({
      readSheetMatrix: vi.fn(async () => {
        throw new Error('network down')
      }),
    })
    await expect(new WorkbookService(repo, 'wb-1').hydrate()).rejects.toThrow('network down')
    const state = useWorkbookStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBe('network down')
    expect(operations.finish).toHaveBeenCalledTimes(1)
  })

  it('stringifies non-Error failures for the store message', async () => {
    const repo = makeRepo({
      readSheetMatrix: vi.fn(async () => {
        throw 'boom'
      }),
    })
    await expect(new WorkbookService(repo, 'wb-1').hydrate()).rejects.toBe('boom')
    expect(useWorkbookStore.getState().error).toBe('boom')
  })
})

describe('save', () => {
  it('writes every sheet from the snapshot and ends the save cleanly', async () => {
    const repo = makeRepo()
    const service = new WorkbookService(repo, 'wb-1')
    await service.hydrate()
    useWorkbookStore.getState().mutateTab('tags', (matrix) => matrix)
    vi.clearAllMocks()

    await service.save()

    expect(repo.replaceSheetMatrix).toHaveBeenCalledTimes(SHEET_NAMES.length)
    expect(repo.replaceSheetMatrix).toHaveBeenCalledWith(
      'wb-1',
      'tags',
      useWorkbookStore.getState().tabs.tags,
    )
    const state = useWorkbookStore.getState()
    expect(state.dirty).toBe(false)
    expect(state.saveInProgress).toBe(false)

    expect(operations.start).toHaveBeenCalledWith('save', {
      total: SHEET_NAMES.length,
      blocking: true,
      message: 'workbook.savingWorkbook',
    })
    expect(operations.progress).toHaveBeenCalledTimes(SHEET_NAMES.length)
    expect(operations.fail).not.toHaveBeenCalled()
    expect(operations.finish).toHaveBeenCalledTimes(1)
  })

  it('remembers how many audit rows the written snapshot held', async () => {
    const repo = makeRepo()
    const service = new WorkbookService(repo, 'wb-1')
    await service.hydrate()
    useWorkbookStore
      .getState()
      .mutateTab('audit_log', (matrix) => [
        ...matrix,
        ['AL1', '2026-01-01T00:00:00.000Z', 'local', 'tag', 'TG1', 'create', '', '{}', 'name', '', ''],
      ])

    await service.save()

    expect(useWorkbookStore.getState().savedAuditRows).toBe(1)
  })

  it('starts a non-blocking operation when the caller shows its own progress', async () => {
    const repo = makeRepo()
    useWorkbookStore.getState().mutateTab('tags', (matrix) => matrix)

    await new WorkbookService(repo, 'wb-1').save({ blocking: false })

    expect(operations.start).toHaveBeenCalledWith('save', {
      total: SHEET_NAMES.length,
      blocking: false,
      message: 'workbook.savingWorkbook',
    })
  })

  it('ends the save unsuccessfully, reports the sheet and rethrows on failure', async () => {
    const repo = makeRepo({
      replaceSheetMatrix: vi.fn(async (_workbookId: string, sheet: SheetName) => {
        if (sheet === 'jobs') throw new Error('quota')
      }),
    })
    useWorkbookStore.getState().mutateTab('tags', (matrix) => matrix)
    useWorkbookStore.getState().setSavedAuditRows(4)

    await expect(new WorkbookService(repo, 'wb-1').save()).rejects.toThrow('quota')
    const state = useWorkbookStore.getState()
    expect(state.dirty).toBe(true)
    expect(state.saveInProgress).toBe(false)
    // A failed save persisted nothing new for certain — the baseline stays.
    expect(state.savedAuditRows).toBe(4)
    expect(operations.fail).toHaveBeenCalledWith('jobs')
    expect(operations.finish).toHaveBeenCalledTimes(1)
  })
})

describe('refresh', () => {
  it('delegates to hydrate', async () => {
    const repo = makeRepo()
    const service = new WorkbookService(repo, 'wb-1')
    const spy = vi.spyOn(service, 'hydrate')
    await service.refresh()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(useWorkbookStore.getState().status).toBe('ready')
  })
})
