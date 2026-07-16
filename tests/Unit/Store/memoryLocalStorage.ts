import { vi } from 'vitest'

/**
 * Installs a functional Map-backed `localStorage` global for the duration of
 * a test (restore with `vi.unstubAllGlobals()`).
 *
 * Needed because Node 25 ships a `localStorage` global that is only
 * operational when `--localstorage-file` points at a real file; under vitest
 * it shadows jsdom's implementation with a stub whose `getItem`/`setItem`
 * are not functions.
 */
export function installFakeLocalStorage(): Storage {
  const entries = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return entries.size
    },
    clear: () => {
      entries.clear()
    },
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key)
    },
    setItem: (key, value) => {
      entries.set(key, value)
    },
  }
  vi.stubGlobal('localStorage', storage)
  return storage
}
