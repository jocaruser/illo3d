import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDriveMigrationTarget } from './driveBackup'
import { driveFetch } from '@/services/drive/client'
import { readMetadata, updateMetadata } from '@/services/drive/metadata'

vi.mock('@/services/drive/client', () => ({
  driveFetch: vi.fn(),
}))

vi.mock('@/services/sheets/client', () => ({
  sheetsFetch: vi.fn(),
}))

vi.mock('@/services/drive/metadata', () => ({
  readMetadata: vi.fn(),
  updateMetadata: vi.fn(),
}))

const driveFetchMock = vi.mocked(driveFetch)
const readMetadataMock = vi.mocked(readMetadata)
const updateMetadataMock = vi.mocked(updateMetadata)

const METADATA = {
  app: 'illo3d',
  version: '1.5.0',
  spreadsheetId: 'original-id',
  createdAt: '2025-01-01T00:00:00.000Z',
  createdBy: 'dev@illo3d.local',
}

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: async () => body } as Response
}

function targetParams() {
  return {
    folderId: 'folder-1',
    spreadsheetId: 'original-id',
    fromVersion: '1.5.0',
    toVersion: '2.0.0',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  driveFetchMock.mockResolvedValue(jsonResponse({ id: 'working-id' }))
  readMetadataMock.mockResolvedValue(METADATA)
  updateMetadataMock.mockResolvedValue(undefined)
})

describe('createDriveMigrationTarget', () => {
  it('creates the working copy via drive files.copy into the shop folder', async () => {
    const workingCopy = await createDriveMigrationTarget(
      targetParams()
    ).createWorkingCopy()

    expect(driveFetchMock).toHaveBeenCalledWith(
      '/files/original-id/copy',
      expect.objectContaining({ method: 'POST' })
    )
    const body = JSON.parse(
      (driveFetchMock.mock.calls[0][1] as RequestInit).body as string
    )
    expect(body.parents).toEqual(['folder-1'])
    expect(body.name).toContain('v1.5.0.v2.0.0.migration')
    expect(workingCopy.ctx.workingSpreadsheetId).toBe('working-id')
    expect(workingCopy.ctx.backend).toBe('google-drive')
  })

  it('throws when the copy request fails', async () => {
    driveFetchMock.mockResolvedValue(jsonResponse({}, false))
    await expect(
      createDriveMigrationTarget(targetParams()).createWorkingCopy()
    ).rejects.toThrow('Failed to copy spreadsheet')
  })

  it('commit updates metadata to the working copy id and new version first', async () => {
    const workingCopy = await createDriveMigrationTarget(
      targetParams()
    ).createWorkingCopy()

    await workingCopy.commit({ keepOriginalAsBackup: false })

    expect(updateMetadataMock).toHaveBeenCalledWith('folder-1', {
      ...METADATA,
      version: '2.0.0',
      spreadsheetId: 'working-id',
    })
  })

  it('commit renames the working copy to the canonical spreadsheet name', async () => {
    const workingCopy = await createDriveMigrationTarget(
      targetParams()
    ).createWorkingCopy()

    await workingCopy.commit({ keepOriginalAsBackup: false })

    expect(driveFetchMock).toHaveBeenCalledWith(
      '/files/working-id',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'illo3d-data' }),
      })
    )
  })

  it('commit with keepOriginalAsBackup renames the original to a backup name', async () => {
    const workingCopy = await createDriveMigrationTarget(
      targetParams()
    ).createWorkingCopy()

    await workingCopy.commit({ keepOriginalAsBackup: true })

    const renameCall = driveFetchMock.mock.calls.find(
      ([path, options]) =>
        path === '/files/original-id' &&
        (options as RequestInit).method === 'PATCH'
    )
    expect(renameCall).toBeDefined()
    const body = JSON.parse((renameCall![1] as RequestInit).body as string)
    expect(body.name).toContain('v1.5.0.backup')
    const deleteCall = driveFetchMock.mock.calls.find(
      ([, options]) => (options as RequestInit)?.method === 'DELETE'
    )
    expect(deleteCall).toBeUndefined()
  })

  it('commit without backup deletes the original spreadsheet', async () => {
    const workingCopy = await createDriveMigrationTarget(
      targetParams()
    ).createWorkingCopy()

    await workingCopy.commit({ keepOriginalAsBackup: false })

    expect(driveFetchMock).toHaveBeenCalledWith('/files/original-id', {
      method: 'DELETE',
    })
  })

  it('commit fails without touching files when metadata is missing', async () => {
    readMetadataMock.mockResolvedValue(null)
    const workingCopy = await createDriveMigrationTarget(
      targetParams()
    ).createWorkingCopy()
    driveFetchMock.mockClear()

    await expect(
      workingCopy.commit({ keepOriginalAsBackup: false })
    ).rejects.toThrow('Shop metadata not found')

    expect(updateMetadataMock).not.toHaveBeenCalled()
    expect(driveFetchMock).not.toHaveBeenCalled()
  })
})
