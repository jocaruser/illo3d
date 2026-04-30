const DB_NAME = 'illo3d-fs-handles'
const STORE_NAME = 'handles'
const KEY = 'localDirectoryHandle'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB is not available'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

function withDb(operation: (db: IDBDatabase) => Promise<void>): Promise<void> {
  return openDb()
    .then(operation)
    .catch(() => {})
}

export async function saveLocalDirectoryHandle(
  handle: FileSystemDirectoryHandle | null
): Promise<void> {
  return withDb(async (db) => {
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      if (handle) {
        const request = store.put(handle, KEY)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      } else {
        const request = store.delete(KEY)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      }
    })
  })
}

export async function restoreLocalDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window !== 'undefined') {
    const mock = (window as unknown as Record<string, unknown>).__e2eMockDirectoryHandle
    if (mock != null) {
      return mock as FileSystemDirectoryHandle
    }
  }
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(KEY)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (result != null && typeof result === 'object') {
          resolve(result as FileSystemDirectoryHandle)
        } else {
          resolve(null)
        }
      }
    })
  } catch {
    return null
  }
}

export async function clearLocalDirectoryHandle(): Promise<void> {
  return saveLocalDirectoryHandle(null)
}
