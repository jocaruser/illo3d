import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CsvFolderRepository } from '../../../tests/unit/helpers/CsvFolderRepository'
import { getFolderRepository, GoogleFolderRepository } from './folderRepository'
import { useBackendStore } from '@/stores/backendStore'
import { LocalFolderRepository } from '@/services/local/LocalFolderRepository'

const mockFetch = vi.fn()

describe('CsvFolderRepository', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  it('readMetadata fetches illo3d.metadata.json and returns parsed JSON', async () => {
    const metadata = {
      app: 'illo3d',
      version: '2.0.0',
      spreadsheetId: 'csv-fixture-happy-path',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'dev@illo3d.local',
    }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(metadata),
    })

    const repo = new CsvFolderRepository()
    const result = await repo.readMetadata('happy-path')

    expect(result).toEqual(metadata)
    expect(mockFetch).toHaveBeenCalledWith(
      '/fixtures/happy-path/illo3d.metadata.json'
    )
  })

  it('readMetadata returns null when fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false })

    const repo = new CsvFolderRepository()
    const result = await repo.readMetadata('nonexistent')

    expect(result).toBeNull()
  })

  it('getFolderName returns folderId', async () => {
    const repo = new CsvFolderRepository()
    const name = await repo.getFolderName('happy-path')
    expect(name).toBe('happy-path')
  })
})

describe('getFolderRepository', () => {
  beforeEach(() => {
    useBackendStore.getState().reset()
  })

  it('returns GoogleFolderRepository when backend is google-drive', () => {
    useBackendStore.setState({ backend: 'google-drive', localDirectoryHandle: null })
    const repo = getFolderRepository()
    expect(repo).toBeInstanceOf(GoogleFolderRepository)
  })

  it('returns GoogleFolderRepository when backend is null and no handle', () => {
    useBackendStore.setState({ backend: null, localDirectoryHandle: null })
    const repo = getFolderRepository()
    expect(repo).toBeInstanceOf(GoogleFolderRepository)
  })

  it('returns LocalFolderRepository when backend is local-csv with handle', () => {
    useBackendStore.setState({ backend: 'local-csv', localDirectoryHandle: {} as FileSystemDirectoryHandle })
    const repo = getFolderRepository()
    expect(repo).toBeInstanceOf(LocalFolderRepository)
  })
})
