import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  copyFile,
  createFolder,
  deleteFile,
  moveFileToFolder,
  renameFile,
} from '@/Repository/GSheet/DriveFiles'

const { driveFetchMock } = vi.hoisted(() => ({ driveFetchMock: vi.fn() }))

vi.mock('@/Repository/GSheet/GoogleApiClient', () => ({
  driveFetch: driveFetchMock,
}))

function jsonResponse(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as Response
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

beforeEach(() => {
  driveFetchMock.mockReset()
  driveFetchMock.mockResolvedValue(jsonResponse({}))
})

describe('createFolder', () => {
  it('creates a Drive folder and returns its id', async () => {
    driveFetchMock.mockResolvedValue(jsonResponse({ id: 'F1' }))
    expect(await createFolder('backup')).toBe('F1')
    expect(driveFetchMock).toHaveBeenCalledWith('/files', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        name: 'backup',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    })
  })

  it('falls back to an empty id', async () => {
    expect(await createFolder('backup')).toBe('')
  })
})

describe('copyFile', () => {
  it('copies into a parent folder when given', async () => {
    driveFetchMock.mockResolvedValue(jsonResponse({ id: 'C1' }))
    expect(await copyFile('S1', 'illo3d-data (copy)', 'F2')).toBe('C1')
    expect(driveFetchMock).toHaveBeenCalledWith('/files/S1/copy', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: 'illo3d-data (copy)', parents: ['F2'] }),
    })
  })

  it('copies in place without a parent and falls back to an empty id', async () => {
    expect(await copyFile('S1', 'copy')).toBe('')
    expect(driveFetchMock).toHaveBeenCalledWith('/files/S1/copy', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: 'copy' }),
    })
  })
})

describe('renameFile', () => {
  it('patches the file name', async () => {
    await renameFile('S1', 'illo3d-data')
    expect(driveFetchMock).toHaveBeenCalledWith('/files/S1', {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: 'illo3d-data' }),
    })
  })
})

describe('deleteFile', () => {
  it('deletes the file', async () => {
    await deleteFile('S1')
    expect(driveFetchMock).toHaveBeenCalledWith('/files/S1', {
      method: 'DELETE',
    })
  })
})

describe('moveFileToFolder', () => {
  it('reparents the file, removing its current parents', async () => {
    driveFetchMock.mockResolvedValueOnce(
      jsonResponse({ parents: ['OLD1', 'OLD2'] })
    )
    await moveFileToFolder('S1', 'F2')
    expect(driveFetchMock).toHaveBeenNthCalledWith(
      1,
      '/files/S1?fields=parents'
    )
    expect(driveFetchMock).toHaveBeenNthCalledWith(
      2,
      '/files/S1?addParents=F2&removeParents=OLD1,OLD2',
      { method: 'PATCH', headers: JSON_HEADERS, body: '{}' }
    )
  })

  it('handles a file without parents', async () => {
    await moveFileToFolder('S1', 'F2')
    expect(driveFetchMock).toHaveBeenNthCalledWith(
      2,
      '/files/S1?addParents=F2&removeParents=',
      {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: '{}',
      }
    )
  })
})
