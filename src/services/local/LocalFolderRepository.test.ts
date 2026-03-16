import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocalFolderRepository } from './LocalFolderRepository'
import { useBackendStore } from '@/stores/backendStore'

function createMockHandle(files: Record<string, string>): FileSystemDirectoryHandle {
  return {
    name: 'test-shop',
    getFileHandle: vi.fn(async (name: string) => {
      const content = files[name]
      if (!content) throw new Error('File not found')
      return {
        getFile: vi.fn(async () => ({
          text: vi.fn(async () => content),
        })),
      } as unknown as FileSystemFileHandle
    }),
  } as unknown as FileSystemDirectoryHandle
}

describe('LocalFolderRepository', () => {
  beforeEach(() => {
    useBackendStore.setState({ localDirectoryHandle: null })
  })

  it('readMetadata returns parsed metadata when handle and file exist', async () => {
    const metadata = {
      app: 'illo3d',
      version: '1.0.0',
      spreadsheetId: 'local-test-shop',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'dev@illo3d.local',
    }
    const handle = createMockHandle({
      'illo3d.metadata.json': JSON.stringify(metadata),
    })
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalFolderRepository()
    const result = await repo.readMetadata('ignored')

    expect(result).toEqual(metadata)
    expect(handle.getFileHandle).toHaveBeenCalledWith('illo3d.metadata.json')
  })

  it('readMetadata returns null when handle is not set', async () => {
    const repo = new LocalFolderRepository()
    const result = await repo.readMetadata('any')
    expect(result).toBeNull()
  })

  it('readMetadata returns null when file does not exist', async () => {
    const handle = createMockHandle({})
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalFolderRepository()
    const result = await repo.readMetadata('any')

    expect(result).toBeNull()
  })

  it('getFolderName returns handle name when set', async () => {
    const handle = createMockHandle({})
    ;(handle as { name: string }).name = 'my-shop'
    useBackendStore.setState({ localDirectoryHandle: handle })

    const repo = new LocalFolderRepository()
    const name = await repo.getFolderName('ignored')

    expect(name).toBe('my-shop')
  })

  it('getFolderName returns empty string when handle is not set', async () => {
    const repo = new LocalFolderRepository()
    const name = await repo.getFolderName('any')
    expect(name).toBe('')
  })
})
