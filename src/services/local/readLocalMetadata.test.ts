import { describe, it, expect, vi } from 'vitest'
import { readMetadataFromDirectoryHandle } from './readLocalMetadata'

describe('readMetadataFromDirectoryHandle', () => {
  it('returns null when metadata file is missing', async () => {
    const handle = {
      getFileHandle: vi.fn().mockRejectedValue(new Error('not found')),
    } as unknown as FileSystemDirectoryHandle

    await expect(readMetadataFromDirectoryHandle(handle)).resolves.toBeNull()
  })

  it('returns parsed metadata when file exists', async () => {
    const meta = {
      app: 'illo3d',
      version: '2.0.0',
      spreadsheetId: 's1',
      createdAt: '2020-01-01',
      createdBy: 'a@b.com',
    }
    const fileLike = {
      text: vi.fn().mockResolvedValue(JSON.stringify(meta)),
    }
    const handle = {
      getFileHandle: vi.fn().mockResolvedValue({
        getFile: vi.fn().mockResolvedValue(fileLike),
      }),
    } as unknown as FileSystemDirectoryHandle

    await expect(readMetadataFromDirectoryHandle(handle)).resolves.toEqual(meta)
  })
})
