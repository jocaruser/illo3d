import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { GDriveFolderRepository } from '@/Repository/GSheet/GDriveFolderRepository'

const { driveFetchMock, uploadMultipartMock } = vi.hoisted(() => ({
  driveFetchMock: vi.fn(),
  uploadMultipartMock: vi.fn(),
}))

vi.mock('@/Repository/GSheet/GoogleApiClient', () => ({
  driveFetch: driveFetchMock,
  uploadMultipart: uploadMultipartMock,
}))

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response
}

function textResponse(body: string): Response {
  return { ok: true, status: 200, text: async () => body } as Response
}

const repository = new GDriveFolderRepository()

const metadata: ShopMetadata = {
  app: 'illo3d',
  version: '3.0.0',
  spreadsheetId: 'S1',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'user@example.com',
}

const searchPath = `/files?q=${encodeURIComponent(
  "name='illo3d.metadata.json' and 'F1' in parents and trashed=false"
)}&fields=files(id)&pageSize=1`

beforeEach(() => {
  driveFetchMock.mockReset()
  uploadMultipartMock.mockReset()
  uploadMultipartMock.mockResolvedValue(jsonResponse({}))
})

describe('readMetadata', () => {
  it('searches the folder and downloads the file content', async () => {
    driveFetchMock
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'M1' }] }))
      .mockResolvedValueOnce(textResponse(JSON.stringify(metadata)))
    expect(await repository.readMetadata('F1')).toEqual(metadata)
    expect(driveFetchMock).toHaveBeenNthCalledWith(1, searchPath)
    expect(driveFetchMock).toHaveBeenNthCalledWith(2, '/files/M1?alt=media')
  })

  it('returns null when the search finds nothing', async () => {
    driveFetchMock.mockResolvedValueOnce(jsonResponse({ files: [] }))
    expect(await repository.readMetadata('F1')).toBeNull()
    expect(driveFetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns null when the response has no files field', async () => {
    driveFetchMock.mockResolvedValueOnce(jsonResponse({}))
    expect(await repository.readMetadata('F1')).toBeNull()
  })

  it('returns null when the found file has no id', async () => {
    driveFetchMock.mockResolvedValueOnce(jsonResponse({ files: [{}] }))
    expect(await repository.readMetadata('F1')).toBeNull()
  })

  it('returns null when the content is not valid JSON', async () => {
    driveFetchMock
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'M1' }] }))
      .mockResolvedValueOnce(textResponse('not json {'))
    expect(await repository.readMetadata('F1')).toBeNull()
  })

  it('returns null when the JSON is not shop metadata', async () => {
    driveFetchMock
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'M1' }] }))
      .mockResolvedValueOnce(textResponse('{"app":"other"}'))
    expect(await repository.readMetadata('F1')).toBeNull()
  })
})

describe('writeMetadata', () => {
  it('updates the existing file content in place', async () => {
    driveFetchMock.mockResolvedValueOnce(
      jsonResponse({ files: [{ id: 'M1' }] })
    )
    await repository.writeMetadata('F1', metadata)
    expect(uploadMultipartMock).toHaveBeenCalledWith(
      {},
      JSON.stringify(metadata, null, 2),
      {
        fileId: 'M1',
      }
    )
  })

  it('creates the file inside the folder when absent', async () => {
    driveFetchMock.mockResolvedValueOnce(jsonResponse({ files: [] }))
    await repository.writeMetadata('F1', metadata)
    expect(uploadMultipartMock).toHaveBeenCalledWith(
      {
        name: 'illo3d.metadata.json',
        parents: ['F1'],
        mimeType: 'application/json',
      },
      JSON.stringify(metadata, null, 2)
    )
  })
})

describe('getFolderName', () => {
  it('reads the folder display name', async () => {
    driveFetchMock.mockResolvedValueOnce(jsonResponse({ name: 'Taller 3D' }))
    expect(await repository.getFolderName('F1')).toBe('Taller 3D')
    expect(driveFetchMock).toHaveBeenCalledWith('/files/F1?fields=name')
  })

  it('falls back to an empty name', async () => {
    driveFetchMock.mockResolvedValueOnce(jsonResponse({}))
    expect(await repository.getFolderName('F1')).toBe('')
  })
})
