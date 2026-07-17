import type { StateStorage } from 'zustand/middleware'

/**
 * Storage source for every persisted Zustand store: pass it to
 * `createJSONStorage(appStorage)`.
 *
 * Persistence is deliberately `localStorage` (see ARCHITECTURE.md, "Client-side
 * persistence"): the persisted values (shop ids, backend choice, preferences)
 * are not secret, and surviving the tab is exactly the point — v2's
 * sessionStorage dropped users back at the setup wizard on every new tab.
 *
 * When `localStorage` is unusable — missing, access throws (privacy modes),
 * or writes fail (zero-quota modes, non-browser stubs) — a shared in-memory
 * Map-backed fallback keeps the stores functional for the lifetime of the
 * page. Usability is probed with a canary write because some environments
 * expose a `localStorage` global that is not an operational `Storage`.
 */
function createMemoryStorage(): StateStorage {
  const entries = new Map<string, string>()
  return {
    getItem: (name) => entries.get(name) ?? null,
    setItem: (name, value) => {
      entries.set(name, value)
    },
    removeItem: (name) => {
      entries.delete(name)
    },
  }
}

/** Module-level singleton so every store shares one fallback area. */
const memoryStorage = createMemoryStorage()

const CANARY_KEY = '__illo3d-storage-canary__'

export const appStorage = (): StateStorage => {
  try {
    const candidate = localStorage
    candidate.setItem(CANARY_KEY, CANARY_KEY)
    candidate.removeItem(CANARY_KEY)
    return candidate
  } catch {
    return memoryStorage
  }
}
