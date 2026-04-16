import { createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

/**
 * Production builds use sessionStorage (cleared when the tab closes).
 * Dev / e2e use localStorage so Playwright `storageState` can restore persisted stores
 * (Playwright only saves cookies + localStorage, not sessionStorage).
 *
 * Vitest: `createJSONStorage` caches the first Storage instance. With `isolate`, each
 * test file gets a new jsdom `window`, but the store module stays cached — the cached
 * Storage then points at a torn-down window and `setItem` breaks. Use a singleton
 * in-memory adapter under MODE=test instead.
 */
const testPersistMap = new Map<string, string>()

const testMemoryStorage: StateStorage = {
  getItem: (name) => testPersistMap.get(name) ?? null,
  setItem: (name, value) => {
    testPersistMap.set(name, value)
  },
  removeItem: (name) => {
    testPersistMap.delete(name)
  },
}

/** Clears the Vitest-only persist backing map (see `src/test/setup.ts`). */
export function clearTestPersistStorage() {
  testPersistMap.clear()
}

/** Read raw persisted JSON for a key (Vitest / MODE=test only). */
export function readTestPersistEntry(name: string): string | null {
  return testPersistMap.get(name) ?? null
}

export function appPersistJSONStorage() {
  return createJSONStorage(() =>
    import.meta.env.MODE === 'test'
      ? (testMemoryStorage as unknown as Storage)
      : import.meta.env.PROD
        ? globalThis.sessionStorage
        : globalThis.localStorage,
  )
}
