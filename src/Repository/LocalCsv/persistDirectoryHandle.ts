/**
 * IndexedDB persistence for the Local CSV directory handle — the only browser
 * store that can hold a `FileSystemDirectoryHandle` across reloads (see
 * ARCHITECTURE.md, "Client-side persistence"). Environments without
 * `indexedDB` degrade to a no-op / null restore.
 */

const DB_NAME = 'illo3d'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'local-directory'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('indexedDB open failed'))
  })
}

/** Store the handle (or clear it when null) under the well-known key. */
export async function persistDirectoryHandle(
  handle: FileSystemDirectoryHandle | null
): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const db = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      if (handle === null) {
        store.delete(HANDLE_KEY)
      } else {
        store.put(handle, HANDLE_KEY)
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('indexedDB write failed'))
    })
  } finally {
    db.close()
  }
}

/** Read the persisted handle back; null when never persisted or unavailable. */
export async function restoreDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof indexedDB === 'undefined') return null
  const db = await openDatabase()
  try {
    return await new Promise<FileSystemDirectoryHandle | null>(
      (resolve, reject) => {
        const request = db
          .transaction(STORE_NAME, 'readonly')
          .objectStore(STORE_NAME)
          .get(HANDLE_KEY)
        request.onsuccess = () =>
          resolve(
            (request.result as FileSystemDirectoryHandle | undefined) ?? null
          )
        request.onerror = () =>
          reject(request.error ?? new Error('indexedDB read failed'))
      }
    )
  } finally {
    db.close()
  }
}
