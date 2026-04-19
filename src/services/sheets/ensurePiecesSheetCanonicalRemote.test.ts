import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SHEET_HEADERS } from '@/services/sheets/config'
import { ensurePiecesSheetCanonicalRemote } from './ensurePiecesSheetCanonicalRemote'

const sheetsFetch = vi.fn()
vi.mock('./client', () => ({
  sheetsFetch: (...args: unknown[]) => sheetsFetch(...args),
}))

const replaceSheetMatrix = vi.fn()
vi.mock('./repository', () => ({
  getSheetsRepository: () => ({ replaceSheetMatrix }),
}))

vi.mock('@/config/csvBackend', () => ({
  getBackend: () => 'google-drive',
  isCsvBackendEnabled: () => false,
}))

vi.mock('@/stores/backendStore', () => ({
  useBackendStore: { getState: () => ({ localDirectoryHandle: null }) },
}))

describe('ensurePiecesSheetCanonicalRemote', () => {
  beforeEach(() => {
    sheetsFetch.mockReset()
    replaceSheetMatrix.mockReset()
  })

  it('rewrites pieces when headers omit units and lifecycle columns', async () => {
    const legacy = [
      ['id', 'job_id', 'name', 'status', 'price', 'created_at'],
      ['p1', 'j1', 'Piece A', 'done', '12', '2020-01-01'],
    ]
    sheetsFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ values: legacy }),
    })

    await ensurePiecesSheetCanonicalRemote('ss-1')

    expect(replaceSheetMatrix).toHaveBeenCalledTimes(1)
    expect(replaceSheetMatrix).toHaveBeenCalledWith(
      'ss-1',
      'pieces',
      expect.arrayContaining([
        [...SHEET_HEADERS.pieces.map(String)],
        expect.arrayContaining(['p1', 'j1', 'Piece A', 'done', '12', '', '2020-01-01', '', '']),
      ]),
    )
  })

  it('does not call replace when pieces already matches canonical headers', async () => {
    const canonHeader = [...SHEET_HEADERS.pieces.map(String)]
    const row = ['p1', 'j1', 'Piece A', 'done', '12', '1', '2020-01-01', '', '']
    sheetsFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ values: [canonHeader, row] }),
    })

    await ensurePiecesSheetCanonicalRemote('ss-2')

    expect(replaceSheetMatrix).not.toHaveBeenCalled()
  })
})
