import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  persistDirectoryHandle,
  restoreDirectoryHandle,
} from '@/Repository/LocalCsv/persistDirectoryHandle'

/**
 * Minimal IndexedDB fake: fires the request/transaction events on a
 * microtask, after the production code has attached its handlers. Failure
 * modes are opt-in per stage; a `null` failure fires `onerror` with a null
 * `error` property to exercise the fallback messages.
 */
interface Failures {
  open?: Error | null
  write?: Error | null
  read?: Error | null
}

interface FakeIdb {
  indexedDb: { open(name: string, version: number): unknown }
  data: Map<string, unknown>
  createObjectStore: ReturnType<typeof vi.fn>
  isClosed(): boolean
  openedWith(): { name: string; version: number } | null
}

function createFakeIndexedDb(
  failures: Failures = {},
  storeExists = false
): FakeIdb {
  const data = new Map<string, unknown>()
  const createObjectStore = vi.fn()
  let closed = false
  let openedWith: { name: string; version: number } | null = null

  interface FakeRequest {
    onupgradeneeded: (() => void) | null
    onsuccess: (() => void) | null
    onerror: (() => void) | null
    result: unknown
    error: Error | null
  }

  const db = {
    objectStoreNames: { contains: () => storeExists },
    createObjectStore,
    close: () => {
      closed = true
    },
    transaction(_store: string, mode: string) {
      const transaction = {
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        error: null as Error | null,
        objectStore: () => ({
          put: (value: unknown, key: string) => data.set(key, value),
          delete: (key: string) => data.delete(key),
          get(key: string) {
            const request: FakeRequest = {
              onupgradeneeded: null,
              onsuccess: null,
              onerror: null,
              result: data.get(key),
              error: null,
            }
            queueMicrotask(() => {
              if ('read' in failures) {
                request.error = failures.read ?? null
                request.onerror?.()
              } else {
                request.onsuccess?.()
              }
            })
            return request
          },
        }),
      }
      if (mode === 'readwrite') {
        queueMicrotask(() => {
          if ('write' in failures) {
            transaction.error = failures.write ?? null
            transaction.onerror?.()
          } else {
            transaction.oncomplete?.()
          }
        })
      }
      return transaction
    },
  }

  const indexedDb = {
    open(name: string, version: number) {
      openedWith = { name, version }
      const request: FakeRequest = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        result: db,
        error: null,
      }
      queueMicrotask(() => {
        if ('open' in failures) {
          request.error = failures.open ?? null
          request.onerror?.()
        } else {
          request.onupgradeneeded?.()
          request.onsuccess?.()
        }
      })
      return request
    },
  }

  return {
    indexedDb,
    data,
    createObjectStore,
    isClosed: () => closed,
    openedWith: () => openedWith,
  }
}

function fakeHandle(name: string): FileSystemDirectoryHandle {
  return { kind: 'directory', name } as FileSystemDirectoryHandle
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('without indexedDB support', () => {
  it('persist is a no-op and restore returns null', async () => {
    expect(typeof indexedDB).toBe('undefined')
    await expect(
      persistDirectoryHandle(fakeHandle('shop'))
    ).resolves.toBeUndefined()
    expect(await restoreDirectoryHandle()).toBeNull()
  })
})

describe('persistDirectoryHandle', () => {
  it('stores the handle under the well-known key and closes the db', async () => {
    const fake = createFakeIndexedDb()
    vi.stubGlobal('indexedDB', fake.indexedDb)
    const handle = fakeHandle('shop')
    await persistDirectoryHandle(handle)
    expect(fake.openedWith()).toEqual({ name: 'illo3d', version: 1 })
    expect(fake.data.get('local-directory')).toBe(handle)
    expect(fake.createObjectStore).toHaveBeenCalledWith('handles')
    expect(fake.isClosed()).toBe(true)
  })

  it('clears the stored handle when passed null', async () => {
    const fake = createFakeIndexedDb()
    fake.data.set('local-directory', fakeHandle('old'))
    vi.stubGlobal('indexedDB', fake.indexedDb)
    await persistDirectoryHandle(null)
    expect(fake.data.has('local-directory')).toBe(false)
  })

  it('skips creating the object store when it already exists', async () => {
    const fake = createFakeIndexedDb({}, true)
    vi.stubGlobal('indexedDB', fake.indexedDb)
    await persistDirectoryHandle(fakeHandle('shop'))
    expect(fake.createObjectStore).not.toHaveBeenCalled()
  })

  it('rejects with the transaction error and still closes the db', async () => {
    const fake = createFakeIndexedDb({ write: new Error('disk full') })
    vi.stubGlobal('indexedDB', fake.indexedDb)
    await expect(persistDirectoryHandle(fakeHandle('shop'))).rejects.toThrow(
      'disk full'
    )
    expect(fake.isClosed()).toBe(true)
  })

  it('falls back to a generic error when the transaction has none', async () => {
    const fake = createFakeIndexedDb({ write: null })
    vi.stubGlobal('indexedDB', fake.indexedDb)
    await expect(persistDirectoryHandle(fakeHandle('shop'))).rejects.toThrow(
      'indexedDB write failed'
    )
  })

  it('rejects when opening the database fails', async () => {
    const fake = createFakeIndexedDb({ open: new Error('blocked') })
    vi.stubGlobal('indexedDB', fake.indexedDb)
    await expect(persistDirectoryHandle(fakeHandle('shop'))).rejects.toThrow(
      'blocked'
    )
  })

  it('falls back to a generic error when the open request has none', async () => {
    const fake = createFakeIndexedDb({ open: null })
    vi.stubGlobal('indexedDB', fake.indexedDb)
    await expect(persistDirectoryHandle(fakeHandle('shop'))).rejects.toThrow(
      'indexedDB open failed'
    )
  })
})

describe('restoreDirectoryHandle', () => {
  it('returns the stored handle and closes the db', async () => {
    const fake = createFakeIndexedDb()
    const handle = fakeHandle('shop')
    fake.data.set('local-directory', handle)
    vi.stubGlobal('indexedDB', fake.indexedDb)
    expect(await restoreDirectoryHandle()).toBe(handle)
    expect(fake.isClosed()).toBe(true)
  })

  it('returns null when nothing was persisted', async () => {
    const fake = createFakeIndexedDb()
    vi.stubGlobal('indexedDB', fake.indexedDb)
    expect(await restoreDirectoryHandle()).toBeNull()
  })

  it('rejects with the request error and still closes the db', async () => {
    const fake = createFakeIndexedDb({ read: new Error('corrupt') })
    vi.stubGlobal('indexedDB', fake.indexedDb)
    await expect(restoreDirectoryHandle()).rejects.toThrow('corrupt')
    expect(fake.isClosed()).toBe(true)
  })

  it('falls back to a generic error when the request has none', async () => {
    const fake = createFakeIndexedDb({ read: null })
    vi.stubGlobal('indexedDB', fake.indexedDb)
    await expect(restoreDirectoryHandle()).rejects.toThrow(
      'indexedDB read failed'
    )
  })
})
