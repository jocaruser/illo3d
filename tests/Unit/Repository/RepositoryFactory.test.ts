import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GDriveFolderRepository } from '@/Repository/GSheet/GDriveFolderRepository'
import { GSheetWorkbookRepository } from '@/Repository/GSheet/GSheetWorkbookRepository'
import { LocalCsvFolderRepository } from '@/Repository/LocalCsv/LocalCsvFolderRepository'
import { LocalCsvWorkbookRepository } from '@/Repository/LocalCsv/LocalCsvWorkbookRepository'
import {
  getFolderRepository,
  getWorkbookRepository,
} from '@/Repository/RepositoryFactory'

const { getStateMock } = vi.hoisted(() => ({ getStateMock: vi.fn() }))

vi.mock('@/Store/backendStore', () => ({
  useBackendStore: { getState: getStateMock },
}))
vi.mock('@/Repository/GSheet/GoogleApiClient', () => ({
  driveFetch: vi.fn(),
  sheetsFetch: vi.fn(),
  uploadMultipart: vi.fn(),
}))

const handle = { kind: 'directory', name: 'shop' } as FileSystemDirectoryHandle

beforeEach(() => {
  getStateMock.mockReset()
})

describe('getWorkbookRepository', () => {
  it('returns the LocalCsv implementation for local-csv with a handle', () => {
    getStateMock.mockReturnValue({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
    expect(getWorkbookRepository()).toBeInstanceOf(LocalCsvWorkbookRepository)
  })

  it('returns the GSheet implementation for google-drive', () => {
    getStateMock.mockReturnValue({
      backend: 'google-drive',
      localDirectoryHandle: null,
    })
    expect(getWorkbookRepository()).toBeInstanceOf(GSheetWorkbookRepository)
  })

  it('throws for local-csv without a directory handle', () => {
    getStateMock.mockReturnValue({
      backend: 'local-csv',
      localDirectoryHandle: null,
    })
    expect(() => getWorkbookRepository()).toThrow('No backend selected')
  })

  it('throws when no backend is selected', () => {
    getStateMock.mockReturnValue({ backend: null, localDirectoryHandle: null })
    expect(() => getWorkbookRepository()).toThrow('No backend selected')
  })
})

describe('getFolderRepository', () => {
  it('returns the LocalCsv implementation for local-csv with a handle', () => {
    getStateMock.mockReturnValue({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
    expect(getFolderRepository()).toBeInstanceOf(LocalCsvFolderRepository)
  })

  it('returns the GDrive implementation for google-drive', () => {
    getStateMock.mockReturnValue({
      backend: 'google-drive',
      localDirectoryHandle: null,
    })
    expect(getFolderRepository()).toBeInstanceOf(GDriveFolderRepository)
  })

  it('throws for local-csv without a directory handle', () => {
    getStateMock.mockReturnValue({
      backend: 'local-csv',
      localDirectoryHandle: null,
    })
    expect(() => getFolderRepository()).toThrow('No backend selected')
  })

  it('throws when no backend is selected', () => {
    getStateMock.mockReturnValue({ backend: null, localDirectoryHandle: null })
    expect(() => getFolderRepository()).toThrow('No backend selected')
  })
})
