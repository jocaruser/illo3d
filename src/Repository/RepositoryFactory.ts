import type { FolderRepositoryInterface } from '@/Repository/FolderRepositoryInterface'
import { GDriveFolderRepository } from '@/Repository/GSheet/GDriveFolderRepository'
import { GSheetWorkbookRepository } from '@/Repository/GSheet/GSheetWorkbookRepository'
import { LocalCsvFolderRepository } from '@/Repository/LocalCsv/LocalCsvFolderRepository'
import { LocalCsvWorkbookRepository } from '@/Repository/LocalCsv/LocalCsvWorkbookRepository'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'
import { useBackendStore } from '@/Store/backendStore'

/**
 * Backend-driven repository selection: the `backendStore` decides whether the
 * app talks to a local folder (File System Access API) or to Google
 * Drive/Sheets. Instances are cheap and stateless — a fresh one per call.
 */

export function getWorkbookRepository(): WorkbookRepositoryInterface {
  const { backend, localDirectoryHandle } = useBackendStore.getState()
  if (backend === 'local-csv' && localDirectoryHandle !== null) {
    return new LocalCsvWorkbookRepository(localDirectoryHandle)
  }
  if (backend === 'google-drive') {
    return new GSheetWorkbookRepository()
  }
  throw new Error('No backend selected')
}

export function getFolderRepository(): FolderRepositoryInterface {
  const { backend, localDirectoryHandle } = useBackendStore.getState()
  if (backend === 'local-csv' && localDirectoryHandle !== null) {
    return new LocalCsvFolderRepository(localDirectoryHandle)
  }
  if (backend === 'google-drive') {
    return new GDriveFolderRepository()
  }
  throw new Error('No backend selected')
}
